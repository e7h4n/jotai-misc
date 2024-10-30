import { atom, createStore, Getter, Setter } from "jotai/vanilla"
import { describe, expect, test } from "vitest"
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
        expect(state.state === 'loaded' && state.value).toBe('success')
    })

    test('will expose error state', async () => {
        const setAtom = atom(null, async () => {
            await delay(20)
            throw new Error('test')
        })

        const actionResultAtom = loadableWritableAtom(setAtom)
        const store = createStore()
        expect(store.get(actionResultAtom).state).toBe('loading')

        await expect(async () => { await store.set(actionResultAtom) }).rejects.toThrow('test')

        const state = store.get(actionResultAtom)
        expect(state.state === 'error' && state.error).toBeInstanceOf(Error)
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
        await expect(async () => { await first }).rejects.toThrow('test')
        expect(store.get(count)).toBe(1)
        expect(store.get(actionResultAtom).state).toBe('loaded')
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
        expect(state.state === 'loaded' && state.value).toBe('2')
    })
})