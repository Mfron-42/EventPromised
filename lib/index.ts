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

export default class EventPromised<T> {

    private eventEmitter: ReplayEventEmitter;
    private promise: Promise<T>;

    constructor(
        execution: (resolve: (result: T) => void, reject: (error: Error) => void,
        emit: (event: string, value?: any) => void)  => void,
        emitter: ReplayEventEmitter = new ReplayEventEmitter()
        ) {
        this.eventEmitter = emitter;
        this.promise = new Promise<T>((resolve, reject) => execution(resolve, reject, emitter.emit.bind(emitter)));
    }

    private static FromPromise<TRes>(promise: Promise<TRes>): EventPromised<TRes> {
        return new EventPromised<TRes>(() => ({})).setPromise(promise);
    }

    private setPromise(promise: Promise<T>): this {
        this.promise = promise;
        return this;
    }

    public then<TResult1 = T, TResult2 = never>(
        onfulfilled: ((value: T) => TResult1 | PromiseLike<TResult1>)
        ): EventPromised<TResult1 | TResult2> {
        return EventPromised.FromPromise(this.promise.then((result) => {
            this.eventEmitter.removeAllListeners();
            return onfulfilled(result);
        }));
    }

    public catch<TResult = never>(
        onrejected: ((reason: any) => TResult | PromiseLike<TResult>)
        ): EventPromised<T | TResult> {
        return EventPromised.FromPromise(this.promise.catch((error) => {
            this.eventEmitter.removeAllListeners();
            return onrejected(error);
        }));
    }

    public on<TData>(eventName: string, onData: (data: TData) => void): this {
        this.eventEmitter.on(eventName, onData);
        return this;
    }

    public once<TData>(eventName: string, onData: (data: TData) => void): this {
        this.eventEmitter.once(eventName, onData);
        return this;
    }
}