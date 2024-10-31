import { atom, createStore, Getter, Setter } from "jotai/vanilla"
import { describe, expect, test, vi } from "vitest"
import { delay } from 'signal-timers'
import { loadableWritableAtom } from "../loadable"
import { createSignalSwitch } from "signal-transaction"

describe('loadableWritableAtom', () => {
    test('will expose loading state', async () => {
        const setAtom = atom(null, async () => {
            await delay(20)
            return 'success'
        })

        const actionResultAtom = loadableWritableAtom(setAtom)
        const store = createStore()
        expect(store.get(actionResultAtom).state).toBe('loading')

        const result = store.set(actionResultAtom)
        expect(store.get(actionResultAtom).state).toBe('loading')

        expect(await result).toBe('success')

        const state = store.get(actionResultAtom)
        expect(state.state === 'hasData' && state.data).toBe('success')
    })

    test('will expose error state', async () => {
        const actionAtom = loadableWritableAtom(atom(null, async () => {
            await delay(20)
            throw new Error('test')
        }))

        const store = createStore()
        const promise = store.set(actionAtom)
        await expect(promise).rejects.toThrow('test')
        await delay(100)

        const state = store.get(actionAtom)
        expect(state.state === 'hasError' && state.error).toBeInstanceOf(Error)
    })

    test('will not accept old result if new action is maded', async () => {
        const count = atom(0)
        const setAtom = atom(null, async (get, set) => {
            if (get(count) === 0) {
                set(count, 1)
                await delay(30)
                throw new Error('test')
            }

            return 'success'
        })

        const actionResultAtom = loadableWritableAtom(setAtom)
        const store = createStore()

        const first = store.set(actionResultAtom)
        const second = store.set(actionResultAtom)
        expect(await second).toBe('success')
        await expect(first).rejects.toThrow('test')
        expect(store.get(count)).toBe(1)
        expect(store.get(actionResultAtom).state).toBe('hasData')
    })

    test('should handle abort error correctly', async () => {
        const count = atom(0)

        const signalSwitch = createSignalSwitch(new AbortController().signal)
        const setAtom = atom(null, signalSwitch(async (signal: AbortSignal, get: Getter, set: Setter): Promise<string> => {
            if (get(count) === 0) {
                set(count, 1)
                await delay(20, { signal })
                return "1"
            }

            await delay(50, { signal })
            return "2"
        }))

        const actionResultAtom = loadableWritableAtom(setAtom)
        const store = createStore()
        const first = store.set(actionResultAtom)
        const second = store.set(actionResultAtom)

        await expect(async () => { await first }).rejects.toThrow('AbortError: signal is aborted without reason')
        expect(await second).toBe('2')
        expect(store.get(count)).toBe(1)
        const state = store.get(actionResultAtom);
        expect(state.state === 'hasData' && state.data).toBe('2')
    })

    test('await and promise then order', async () => {
        const promise = (async () => {
            await delay(20)
        })();

        const trace = vi.fn()

        void promise.then(() => {
            trace('in then promise')
        })

        void promise.finally(() => {
            trace('in finally promise')
        })

        void promise.then().finally(() => {
            trace('in finally promise after then')
        })

        await promise;
        trace('after await')
        expect(trace).toHaveBeenCalledTimes(3)
        expect(trace).toHaveBeenNthCalledWith(1, 'in then promise')
        expect(trace).toHaveBeenNthCalledWith(2, 'in finally promise')
        expect(trace).toHaveBeenNthCalledWith(3, 'after await')

        await delay(0)
        expect(trace).toHaveBeenCalledTimes(4)
    })
})