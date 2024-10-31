import { atom, WritableAtom } from "jotai/vanilla"
import { loadable } from "jotai/vanilla/utils"
import { Loadable } from "jotai/vanilla/utils/loadable"

const NEVER_RESOLVED_PROMISE = new Promise(() => void (0))

export function loadableWritableAtom<Value extends Promise<unknown>, Args extends unknown[]>(
    writableAtom: WritableAtom<null, Args, Value>
): WritableAtom<Loadable<Value | undefined>, Args, Value> {
    const internalPromiseAtom = atom<Value>(NEVER_RESOLVED_PROMISE as Value)
    const internalLoadableAtom = loadable(internalPromiseAtom)

    return atom(get => {
        return get(internalLoadableAtom)
    }, (get, set, ...args: Args): Value => {
        const promise = set(writableAtom, ...args)
        set(internalPromiseAtom, promise)
        get(internalLoadableAtom)
        return promise;
    })
}
