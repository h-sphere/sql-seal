import { describe, it, expect, jest } from '@jest/globals'
import { createSignal, derivedSignal, withSignals } from './signal';

describe('createSignal', () => {
  it('should create a signal with initial value', () => {
    const signal = createSignal(10);
    expect(signal.value).toBe(10);
  });

  it('should create a signal without initial value', () => {
    const signal = createSignal<number>();
    expect(signal.value).toBeUndefined();
  });

  it('should notify subscribers when value changes', () => {
    const signal = createSignal<number>();
    const listener = jest.fn();

    signal(listener);
    signal(42);

    expect(listener).toHaveBeenCalledWith(42);
  });

  it('should call listener immediately with current value if exists', () => {
    const signal = createSignal(10);
    const listener = jest.fn();

    signal(listener);
    expect(listener).toHaveBeenCalledWith(10);
  });

  it('should allow unsubscribing', () => {
    const signal = createSignal<number>();
    const listener = jest.fn();

    const unsubscribe = signal(listener);
    signal(42);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    signal(43);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should allow multiple subscribers', () => {
    const signal = createSignal<number>();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    signal(listener1);
    signal(listener2);
    signal(42);

    expect(listener1).toHaveBeenCalledWith(42);
    expect(listener2).toHaveBeenCalledWith(42);
  });
});

describe('withSignals', () => {
  it('should combine multiple signals', () => {
    const signal1 = createSignal<number>();
    const signal2 = createSignal<string>();
    const callback = jest.fn();

    withSignals(signal1, signal2)(callback);

    signal1(42);
    expect(callback).not.toHaveBeenCalled();

    signal2('hello');
    expect(callback).toHaveBeenCalledWith(42, 'hello');
  });

  it('should work with initial values', () => {
    const signal1 = createSignal(42);
    const signal2 = createSignal('hello');
    const callback = jest.fn();

    withSignals(signal1, signal2)(callback);
    expect(callback).toHaveBeenCalledWith(42, 'hello');
  });

  it('should update when any signal changes', () => {
    const signal1 = createSignal(42);
    const signal2 = createSignal('hello');
    const callback = jest.fn();

    withSignals(signal1, signal2)(callback);
    signal1(43);
    
    expect(callback).toHaveBeenCalledWith(43, 'hello');
  });

  it('should allow unsubscribing from all signals', () => {
    const signal1 = createSignal<number>();
    const signal2 = createSignal<string>();
    const callback = jest.fn();

    const unsubscribe = withSignals(signal1, signal2)(callback);
    
    signal1(42);
    signal2('hello');
    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();
    signal1(43);
    signal2('world');
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('derivedSignal', () => {
  it('should compute derived value', () => {
    const count = createSignal(5);
    const multiplier = createSignal(2);
    
    const product = derivedSignal(
      [count, multiplier],
      (c, m) => c * m
    );

    expect(product.value).toBe(10);
  });

  it('should update when source signals change', () => {
    const count = createSignal(5);
    const multiplier = createSignal(2);
    
    const product = derivedSignal(
      [count, multiplier],
      (c, m) => c * m
    );

    const listener = jest.fn();
    product(listener);

    count(10);
    expect(product.value).toBe(20);
    expect(listener).toHaveBeenCalledWith(20);

    multiplier(3);
    expect(product.value).toBe(30);
    expect(listener).toHaveBeenCalledWith(30);
  });

  it('should handle undefined initial values', () => {
    const signal1 = createSignal<number>();
    const signal2 = createSignal<number>();
    
    const sum = derivedSignal(
      [signal1, signal2],
      (a, b) => a + b
    );

    expect(sum.value).toBeUndefined();

    signal1(5);
    expect(sum.value).toBeUndefined();

    signal2(3);
    expect(sum.value).toBe(8);
  });

  it('should work with complex derivations', () => {
    const firstName = createSignal('John');
    const lastName = createSignal('Doe');
    const age = createSignal(25);

    const person = derivedSignal(
      [firstName, lastName, age],
      (first, last, a) => ({
        fullName: `${first} ${last}`,
        age: a,
        isAdult: a >= 18
      })
    );

    expect(person.value).toEqual({
      fullName: 'John Doe',
      age: 25,
      isAdult: true
    });

    firstName('Jane');
    expect(person.value).toEqual({
      fullName: 'Jane Doe',
      age: 25,
      isAdult: true
    });
  });

  it('should chain derived signals', () => {
    const base = createSignal(5);
    const doubled = derivedSignal([base], n => n * 2);
    const final = derivedSignal([doubled], n => n + 10);

    expect(final.value).toBe(20);

    base(10);
    expect(doubled.value).toBe(20);
    expect(final.value).toBe(30);
  });

  it('should support array transformations', () => {
    const items = createSignal(['apple', 'banana', 'orange']);
    const filter = createSignal('an');

    const filtered = derivedSignal(
      [items, filter],
      (list, f) => list.filter(item => 
        item.toLowerCase().includes(f.toLowerCase())
      )
    );

    expect(filtered.value).toEqual(['banana', 'orange']);

    filter('ap');
    expect(filtered.value).toEqual(['apple']);

    items(['grape', 'apple', 'mango']);
    expect(filtered.value).toEqual(['grape', 'apple']);
  });
});

describe('type safety', () => {
  it('should maintain proper types in derived signals', () => {
    const numberSignal = createSignal<number>(42);
    const stringSignal = createSignal<string>('hello');

    // This should type check
    const derived = derivedSignal(
      [numberSignal, stringSignal],
      (num, str) => ({
        number: num,  // Should be typed as number
        string: str,  // Should be typed as string
        combined: `${str}${num}`
      })
    );

    expect(derived.value).toEqual({
      number: 42,
      string: 'hello',
      combined: 'hello42'
    });
  });
});
