import { atom, WritableAtom } from "jotai/vanilla"
import { Loadable } from "../types/async"

export function loadableWritableAtom<Value extends Promise<unknown>, Args extends unknown[]>(
    writableAtom: WritableAtom<null, Args, Value>
): WritableAtom<Loadable<Awaited<Value>>, Args, Promise<Awaited<Value>>> {
    const internalValueAtom = atom<Awaited<Value>>()
    const internalLoadingAtom = atom(true)
    const internalErrorAtom = atom<unknown>()

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
    }, async (_get, set, ...args: Args): Promise<Awaited<Value>> => {
        console.log('start')
        set(internalLoadingAtom, true)
        try {
            console.log('set')
            const ret = await set(writableAtom, ...args)
            console.log('set ret')
            set(internalValueAtom, ret)
            return ret;
        } catch (err) {
            set(internalErrorAtom, err)
            throw err
        } finally {
            set(internalLoadingAtom, false)
        }
    })
}
