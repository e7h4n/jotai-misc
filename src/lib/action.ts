/**
 * Action is the same as Write-only Atom
 * We often use write-only atoms to describe operation logic, where we typically need to read and write multiple other atoms
 * Therefore, we abstract out the Action type, which is more semantic and avoids the confusing atom(null, fn) declaration
 */

import { atom, Getter, Setter, WritableAtom } from "jotai/vanilla";
import { loadableWritableAtom } from "./loadable";
import { Loadable } from "jotai/vanilla/utils/loadable";

type Write<Args extends unknown[], Result> = (get: Getter, set: Setter, ...args: Args) => Result;

export function asyncActionAtom<Args extends unknown[], Result extends Promise<unknown>>(write: Write<Args, Result>): WritableAtom<Loadable<Result | undefined>, Args, Result> {
    return loadableWritableAtom(atom(null, write))
}
