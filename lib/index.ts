import { EventEmitter, Listener } from "events";

export class ReplayEventEmitter {

    private history: {event: string | number, args: any[] }[] = [];
    private historySize: number = Infinity;
    private emitter: EventEmitter;

    constructor(emitter: EventEmitter = new EventEmitter()) {
        this.emitter = emitter;
    }

    public emit(event: string | number, ...args: any[]): boolean {
        this.history.push({event, args});
        if (this.history.length > this.historySize)
            this.history = this.history.slice(this.history.length - this.historySize);
        return this.emitter.emit(event, args);
    }

    public once(event: string | number, listener: (...args: any[]) => void, useHistory: boolean = true): () => void {
        const matchEvent = useHistory && this.history.find(history => history.event === event);
        if (matchEvent) {
            listener(...matchEvent.args);
            return () => {};
        }
        const call = (...args: any[]) => {
            listener(...args);
            this.emitter.removeListener(event, call);
        };
        this.emitter.on(event, call);
        return () => this.emitter.removeListener(event, call);
    }

    public on(event: string | number, listener: (...args: any[]) => void, useHistory: boolean = true): () => void {
        let call = (data: any) => listener(...data);
        this.emitter.on(event, call);
        if (!useHistory)
            return () => this.emitter.removeListener(event, call);
        this.history.filter(history => history.event === event)
            .forEach(history => listener(...history.args));
        return () => this.emitter.removeListener(event, call);
    }

    public resetHistory(): void {
        this.history = [];
    }

    public setHistorySize(historySize: number): void {
        this.historySize = historySize;
    }

    public removeAllListeners() : void{
        this.emitter.removeAllListeners();
    }
}

interface Actions {
    cancelToken: (error?: any) => void;
};

export default class EventPromised<T> extends Promise<T> {
    private actions: Actions;
    private emitter: ReplayEventEmitter;

    // @ts-ignore
    constructor(
        executor: (resolve:  (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, emit: (event: string, ...value: any[]) => void) => void,
        emitter: ReplayEventEmitter = new ReplayEventEmitter()
        )
        {
            let actions: Actions = {
                cancelToken: () => {
                    throw new Error("Cancelaction token not set");
                }
            };
            executor = executor == undefined ? (() => undefined) : executor;
            super((resolve, reject) => executor((result) => {
                emitter.removeAllListeners()
                resolve(result);
            }, actions.cancelToken = (error) => {
                emitter.removeAllListeners()
                reject(error);
            }, emitter.emit.bind(emitter)));
            this.emitter = emitter;
            this.actions = actions;
    }

    public cancel(error?: any): this {
        this.actions.cancelToken();
        return this;
    }

    public on(eventName: string, onData: (...data: any[]) => void): this {
        this.emitter.on(eventName, onData);
        return this;
    }

    public once(eventName: string, onData: (...data: any[]) => void): this {
        this.emitter.once(eventName, onData);
        return this;
    }
}
