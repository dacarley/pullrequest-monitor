import { SSM, GetParametersByPathCommandInput } from "@aws-sdk/client-ssm";

export type Item = {
    id: string;
    value: string;
}

const ssm = new SSM({});

export async function saveItem(collectionName: string, item: Item) {
    const params = {
        Name: `/${collectionName}/Items/${item.id}`,
        Value: JSON.stringify(item),
        DataType: "text",
        Overwrite: true,
        Tier: "Standard",
        Type: "String"
    };

    return ssm.putParameter(params);
}

export async function deleteItems(collectionName: string, ids: string[]) {
    return ssm.deleteParameters({
        Names: ids.map(id => `/${collectionName}/Items/${id}`)
    });
}

export async function loadItems(collectionName: string) {
    const params: GetParametersByPathCommandInput = {
        Path: `/${collectionName}/Items/`,
        Recursive: true,
    };

    const items: Item[] = [];

    do {
        const result = await ssm.getParametersByPath(params);

        const parameters = result.Parameters ?? [];
        items.push(...parameters.map(parameter => JSON.parse(parameter.Value ?? "")));

        params.NextToken = result.NextToken;
    } while (params.NextToken);

    return items;
}