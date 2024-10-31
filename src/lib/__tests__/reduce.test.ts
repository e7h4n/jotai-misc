import { describe, expect, test } from "vitest";
import { atomWithReducer } from 'jotai/vanilla/utils'
import { atom, createStore } from "jotai/vanilla";
import { delay } from "signal-timers";

describe('reduce', () => {
    test('should reduce correctly', () => {

        const countReducer = (prev: number, action: { type: string }) => {
            if (action.type === 'inc') return prev + 1
            if (action.type === 'dec') return prev - 1
            throw new Error('unknown action type')
        }

        const countReducerAtom = atomWithReducer(0, countReducer)
        const store = createStore()
        store.set(countReducerAtom, { type: 'inc' })
        expect(store.get(countReducerAtom)).toBe(1)
        store.set(countReducerAtom, { type: 'inc' })
        expect(store.get(countReducerAtom)).toBe(2)
        store.set(countReducerAtom, { type: 'dec' })
        expect(store.get(countReducerAtom)).toBe(1)
    })


    test('reduce readonly atom', () => {
        const internalAtom = atom(0)
        const writeAtom = atom(null, (_, set) => {
            set(internalAtom, x => x + 1)
        })
        const readAtom = atom(get => get(internalAtom))

        const store = createStore()
        expect(store.get(readAtom)).toBe(0)
        store.set(writeAtom)
        expect(store.get(readAtom)).toBe(1)

        const internalReduceAtom = atom(0)
        const readReduceAtom = atom(get => get(internalReduceAtom))

        store.sub(readAtom, () => {
            const curr = store.get(readAtom)
            store.set(internalReduceAtom, x => x + curr)
        })
    })
})