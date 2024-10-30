import { describe, expect, test, vi } from "vitest";
import { actionAtom, loadableActionAtom } from "../action";
import { createStore } from "jotai/vanilla";
import { delay } from "signal-timers";

describe('action', () => {
    test('provide a simple way to create a write-only atom', () => {
        const trace = vi.fn()
        const action = actionAtom(() => {
            trace()
            return 'result'
        })

        const ret = createStore().set(action)
        expect(trace).toHaveBeenCalledTimes(1)
        expect(ret).toBe('result')
    })

    test('provide a simple way to create a loadable action atom', async () => {
        const trace = vi.fn()
        const action = loadableActionAtom(async () => {
            await delay(10)
            trace()
            return Promise.resolve('result')
        })

        const store = createStore()
        const ret = store.set(action)
        expect(trace).toHaveBeenCalledTimes(0)
        expect(store.get(action).state).toBe('loading')
        expect(await ret).toBe('result')
        expect(trace).toHaveBeenCalledTimes(1)
        expect(store.get(action).state).toBe('loaded')
    })
})