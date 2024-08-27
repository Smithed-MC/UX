import { Type } from "@sinclair/typebox"
import { API_APP, sendError } from "../../../app.js"
import { HTTPResponses } from "data-types";
import { getFirestore } from "firebase-admin/firestore";

const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g

/** 
 * 
*/
API_APP.route({
    method: "POST",
    url: "/email-lists/:listId/subscribe",
    schema: {
        params: Type.Object({
            listId: Type.String()
        }),
        querystring: Type.Object( {
            email: Type.String({maxLength: 32})
        })
    },
    handler: async (request, reply) => {
        const {listId} = request.params;
        const {email} = request.query;
        
        if (!email.match(EMAIL_REGEX))
            return sendError(reply, HTTPResponses.BAD_REQUEST, "Email is not valid")

        const listDoc = await getFirestore().collection("email-lists").doc(listId).get()

        if (!listDoc.exists)
            return sendError(reply, HTTPResponses.BAD_REQUEST, "Email list does not exist!")

        const emails: string[] = listDoc.get("emails")

        if (emails.includes(email))
            return 

        emails.push(email)

        await listDoc.ref.set({
            emails: emails
        }, {merge: true})
    }
})