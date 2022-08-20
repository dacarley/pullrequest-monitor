export function mapToObject<T, V >(array: T[], pred: (t: T) => [string, V] | string[]): Record<string, V> {
    return (array || []).reduce((r, x) => {
        const [key, value] = pred(x);
        return {
            ...r,
            [key]: value
        };
    }, {});
}

export function keyBy<T>(array: T[], propName = ""): Record<string, T> {
    return mapToObject(array, item => {
        const key = propName ? item[propName] : item;
        return [key, item];
    });
}
