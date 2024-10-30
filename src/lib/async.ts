import { atom, WritableAtom } from "jotai/vanilla"
import { Loadable } from "../types/async"

export function loadableWritableAtom<Value extends Promise<unknown>, Args extends unknown[]>(
    writableAtom: WritableAtom<null, Args, Value>
): WritableAtom<Loadable<Awaited<Value>>, Args, Promise<Awaited<Value>>> {
    const internalValueAtom = atom<Awaited<Value>>()
    const internalLoadingAtom = atom(true)
    const internalErrorAtom = atom<unknown>()
    const internalIndexAtom = atom(0)

    return atom(get => {
        const loading = get(internalLoadingAtom)
        const error = get(internalErrorAtom)
        const value = get(internalValueAtom)

        if (loading) {
            return {
                state: 'loading',
            }
        }

        if (error) {
            return {
                state: 'error',
                error,
            }
        }

        if (value === undefined) {
            throw new Error('Value is undefined')
        }

        return {
            state: 'loaded',
            value: value
        }
    }, async (get, set, ...args: Args): Promise<Awaited<Value>> => {
        const index = get(internalIndexAtom)
        set(internalIndexAtom, x => x + 1)

        set(internalLoadingAtom, true)
        try {
            const ret = await set(writableAtom, ...args)
            if (index !== get(internalIndexAtom) - 1) {
                return ret;
            }

            set(internalValueAtom, ret)
            return ret;
        } catch (err) {
            if (index === get(internalIndexAtom) - 1) {
                set(internalErrorAtom, err)
            }

            throw err
        } finally {
            if (index === get(internalIndexAtom) - 1) {
                set(internalLoadingAtom, false)
            }
        }
    })
}
