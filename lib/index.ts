import { EventEmitter } from "events";

export class ReplayEventEmitter extends EventEmitter {

    private history: {event: string | number, args: any[] }[] = [];
    private historySize: number = Infinity;

    public emit(event: string | number, ...args: any[]): boolean {
        this.history.push({event, args});
        if (this.history.length > this.historySize)
            this.history = this.history.slice(this.history.length - this.historySize);
        return super.emit(event, args);
    }

    public once(event: string | number, listener: (...args: any[]) => void, useHistory: boolean = true): this {
        const matchEvent = useHistory && this.history.find(history => history.event === event);
        if (matchEvent) {
            listener(...matchEvent.args);
            return this;
        }
        const call = (...args: any[]) => {
            listener(args);
            super.removeListener(event, call);
        };
        super.on(event, call);
        return this;
    }

    public on(event: string | number, listener: (...args: any[]) => void, useHistory: boolean = true): this {
        super.on(event, listener);
        if (!useHistory)
            return this;
        this.history.filter(history => history.event === event)
            .forEach(history => listener(...history.args));
        return this;
    }

    public resetHistory(): void {
        this.history = [];
    }

    public setHistorySize(historySize: number): void {
        this.historySize = historySize;
    }
}

export default class EventPromised<T> extends Promise<T> {

    constructor(
        executor: (resolve:  (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void, emit?: (event: string, value?: any) => void) => void,
        private emitter: ReplayEventEmitter = new ReplayEventEmitter()
        )
        {
            super((resolve, reject) => executor((result) => {
                emitter.removeAllListeners()
                resolve(result);
            }, (error) => {
                emitter.removeAllListeners()
                reject(error);
            }, emitter.emit.bind(emitter)));
    }

    public on<TData>(eventName: string, onData: (data: TData) => void): this {
        this.emitter.on(eventName, onData);
        return this;
    }

    public once<TData>(eventName: string, onData: (data: TData) => void): this {
        this.emitter.once(eventName, onData);
        return this;
    }
}