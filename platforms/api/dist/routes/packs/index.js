import { Type } from '@sinclair/typebox';
import { API_APP } from "../../app";
import { getFirestore } from 'firebase-admin/firestore';
var SortOptions;
(function (SortOptions) {
    SortOptions[SortOptions["Trending"] = 0] = "Trending";
    SortOptions[SortOptions["Downloads"] = 1] = "Downloads";
    SortOptions[SortOptions["Alphabetically"] = 2] = "Alphabetically";
})(SortOptions || (SortOptions = {}));
const getOrderField = (sort) => {
    switch (sort) {
        case SortOptions.Trending:
            return 'stats.downloads.today';
        case SortOptions.Downloads:
            return 'stats.downloads.total';
        case SortOptions.Alphabetically:
            return 'data.display.name';
    }
};
API_APP.route({
    method: "GET",
    url: '/packs',
    schema: {
        querystring: Type.Object({
            search: Type.Optional(Type.String()),
            sort: Type.Enum(SortOptions, { default: SortOptions.Downloads }),
            limit: Type.Integer({ maximum: 100, minimum: 1, default: 20 }),
            start: Type.Integer({ minimum: 0, default: 0 })
        })
    },
    handler: async (request, reply) => {
        const { search, sort, limit, start } = request.query;
        const firestore = getFirestore();
        let packs = firestore.collection('packs').startAt(start).limit(limit).orderBy(getOrderField(sort));
        if (search !== '')
            packs = packs.where('_indices', 'array-contains', search);
        const results = await packs.get();
        if (results.empty)
            return [];
        return results.docs.map(d => d.id);
    }
});
