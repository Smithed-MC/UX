import { Type } from "@sinclair/typebox";
import { API_APP } from "../app.js";

export function sanitize(value: string) {
    return value.toLowerCase().replaceAll(' ', '-').replaceAll(/(\s+|\[|\]|{|}|\||\\|"|%|~|#|<|>|\?)/g, '');
}

API_APP.route({
    method: 'GET',
    url: '/sanitize',
    schema: {
        querystring: Type.Object({
            value: Type.String()
        })
    }, 
    handler: async (response, reply) => {
        const {value} = response.query
        return sanitize(value)
    }
})