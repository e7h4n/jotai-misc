/**
 * Action is the same as Write-only Atom
 * We often use write-only atoms to describe operation logic, where we typically need to read and write multiple other atoms
 * Therefore, we abstract out the Action type, which is more semantic and avoids the confusing atom(null, fn) declaration
 */

import { atom, Getter, Setter, WritableAtom } from "jotai/vanilla";
import { Loadable } from "../types/loadable";
import { loadableWritableAtom } from "./loadable";

type Write<Args extends unknown[], Result> = (get: Getter, set: Setter, ...args: Args) => Result;

export function actionAtom<Args extends unknown[], Result>(write: Write<Args, Result>): WritableAtom<null, Args, Result> {
    return atom(null, write)
}

export function loadableActionAtom<Args extends unknown[], Result extends Promise<unknown>>(write: Write<Args, Result>): WritableAtom<Loadable<Awaited<Result>>, Args, Promise<Awaited<Result>>> {
    return loadableWritableAtom(actionAtom(write))
}
