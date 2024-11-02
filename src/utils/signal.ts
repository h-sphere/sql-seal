/**
 * Enhanced signal types to include value access
 */
export interface SignalListener<T> {
  (event: T): void;
}

export interface SignalUnsubscriber {
  (): void;
}

export interface SignalSubscriber<T> {
  (listener: SignalListener<T>): SignalUnsubscriber;
}

export interface SignalDispatcher<T> {
  (event: T): void;
}

export interface SignalValue<T> {
  readonly value: T;
}

export type Signal<T> = SignalSubscriber<T> & SignalDispatcher<T> & SignalValue<T>;
export type SignalReturn = SignalUnsubscriber & void;

export function createSignal<T>(): Signal<T>;
export function createSignal<T>(initialValue: T): Signal<T>;
export function createSignal<T>(initialValue?: T): Signal<T> {
  const subscribers = new Set<SignalListener<T>>();
  let currentValue: T | undefined = initialValue;
  
  const signal = ((eventOrListener: T | SignalListener<T>): any => {
    if (typeof eventOrListener === 'function') {
      subscribers.add(eventOrListener as SignalListener<T>);
      // Call the listener immediately with current value if it exists
      if (currentValue !== undefined) {
        (eventOrListener as SignalListener<T>)(currentValue);
      }
      return () => { subscribers.delete(eventOrListener as SignalListener<T>) };
    } else {
      currentValue = eventOrListener;
      subscribers.forEach(listener => listener(eventOrListener));
    }
  }) as Signal<T>;

  // Add value getter
  Object.defineProperty(signal, 'value', {
    get: () => currentValue,
    enumerable: true
  });

  return signal;
}

/**
 * Utility types for handling async compute functions
 */
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type ComputeReturnType<Args extends any[], R> = 
  | ((...args: Args) => R)
  | ((...args: Args) => Promise<R>);

/**
 * Utility type to extract the event type from a Signal
 */
export type SignalEventType<T> = T extends Signal<infer E> ? E : never;

/**
 * Creates a new signal that derives its value from other signals
 * Supports both synchronous and asynchronous compute functions
 */
export function derivedSignal<Signals extends Signal<any>[], R>(
  signals: [...Signals],
  compute: ComputeReturnType<{ [K in keyof Signals]: SignalEventType<Signals[K]> }, R>
): Signal<UnwrapPromise<R>> {
  const derivedSignal = createSignal<UnwrapPromise<R>>();
  let computeVersion = 0;
  let isComputing = false;
  
  const updateValue = async (version: number, values: { [K in keyof Signals]: SignalEventType<Signals[K]> }) => {
    if (isComputing) return;
    isComputing = true;
    
    try {
      const result = compute(...Object.values(values) as { [K in keyof Signals]: SignalEventType<Signals[K]> });
      const computedValue = result instanceof Promise ? await result : result;
      
      // Only update if this is still the latest computation
      if (version === computeVersion) {
        derivedSignal(computedValue as UnwrapPromise<R>);
      }
    } catch (error) {
      console.error('Error in derived signal computation:', error);
    } finally {
      isComputing = false;
    }
  };
  
  // Compute initial value if all source signals have values
  const initialValues = signals.map(s => s.value);
  if (!initialValues.includes(undefined)) {
    updateValue(computeVersion, initialValues as { [K in keyof Signals]: SignalEventType<Signals[K]> });
  }
  
  // Handle updates
  withSignals(...signals)((...args) => {
    computeVersion++;
    updateValue(computeVersion, args as { [K in keyof Signals]: SignalEventType<Signals[K]> });
  });
  
  return derivedSignal;
}
/**
 * Takes multiple signals and returns a function that accepts a callback
 * which will receive the values from those signals
 */
export function withSignals<Signals extends Signal<any>[]>(
  ...signals: Signals
): <R>(
  callback: (...values: { [K in keyof Signals]: SignalEventType<Signals[K]> }) => R
) => SignalUnsubscriber {
  return (callback) => {
    const unsubscribers: SignalUnsubscriber[] = [];
    const values = new Array(signals.length) as { [K in keyof Signals]: SignalEventType<Signals[K]> };
    let initialized = new Array(signals.length).fill(false);
    
    signals.forEach((signal, index) => {
      const unsubscribe = signal((value) => {
        values[index] = value as { [K in keyof Signals]: SignalEventType<Signals[K]> }[number];
        initialized[index] = true;
        
        if (initialized.every(Boolean)) {
          callback(...(values as unknown as { [K in keyof Signals]: SignalEventType<Signals[K]> }));
        }
      });
      unsubscribers.push(unsubscribe);
    });
    
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  };
}