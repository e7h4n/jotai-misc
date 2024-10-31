import { describe, expect, test, vi } from "vitest";
import { asyncActionAtom } from "../action";
import { createStore } from "jotai/vanilla";
import { delay } from "signal-timers";

describe('action', () => {
    test('provide a simple way to create a write-only atom', async () => {
        const trace = vi.fn()
        const action = asyncActionAtom(() => {
            trace()
            return Promise.resolve('result')
        })

        const ret = createStore().set(action)
        expect(trace).toHaveBeenCalledTimes(1)
        expect(await ret).toBe('result')
    })

    test('provide a simple way to create a loadable action atom', async () => {
        const trace = vi.fn()
        const actionAtom = asyncActionAtom(async () => {
            await delay(10)
            trace()
            return Promise.resolve('result')
        })

        const store = createStore()
        const ret = store.set(actionAtom)
        expect(trace).toHaveBeenCalledTimes(0)
        expect(store.get(actionAtom).state).toBe('loading')
        expect(await ret).toBe('result')
        expect(trace).toHaveBeenCalledTimes(1)
        expect(store.get(actionAtom).state).toBe('hasData')
    })
})