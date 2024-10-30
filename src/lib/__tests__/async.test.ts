import { atom, createStore } from "jotai/vanilla"
import { describe, expect, test } from "vitest"
import { delay } from 'signal-timers'
import { loadableWritableAtom } from "../async"

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

        const firstPromise = store.set(actionResultAtom)
        const secondPromise = store.set(actionResultAtom)
        expect(await secondPromise).toBe('success')
        await expect(async () => { await firstPromise }).rejects.toThrow('test')
        expect(store.get(count)).toBe(1)
        expect(store.get(actionResultAtom).state).toBe('loaded')
    })
})