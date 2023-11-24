import { Request, Response } from "express";
import prismaClient from '../../prismaClient'
import z from 'zod'
import { AuthenticatedRequest } from "../../requireAuth";
import { getUser } from "./getUser";

export const addMutablePicklist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    try {
        const user = await getUser(req, res)

        if(user === null)
        {
            return
        }
        const MutablePicklistSchema = z.object({
            name : z.string(),
            teams : z.array(z.number().min(0)),
            authorId : z.string()
        }) 

        const currMutablePicklist = {
            name: req.body.name,
            teams: req.body.teams,
            authorId : user.id
        }
        const possibleTypeError = MutablePicklistSchema.safeParse(currMutablePicklist)
        if(!possibleTypeError.success)
        {
            res.status(400).send(possibleTypeError)
            return
        }

           const row = await prismaClient.mutablePicklist.create({
            data: currMutablePicklist
        });

        res.status(200).send("mutable picklist added");
    } catch(error) {
        console.error(error);
        res.status(400).send(error);
    }

};
