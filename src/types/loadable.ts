export type Loadable<T> = {
    state: 'loading',
} | {
    value: T,
    state: 'loaded',
} | {
    error: unknown,
    state: 'error',
}
