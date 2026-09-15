import { NextFunction, Request, Response } from "express";
import { HttpStatusCode, ResponseMessage } from "../enums";
import { ChatService } from "../services/chat.service";
import { ApiResponse } from "../utils/api-response.util";
import { chatMessageSchema } from "../validations/chat.validation";

export class ChatController {
  constructor(private chatService: ChatService = new ChatService()) {}

  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = chatMessageSchema.parse(req.body);
      const reply = await this.chatService.getResponse(message);

      return ApiResponse.send(
        res,
        { reply },
        ResponseMessage.CHAT_RESPONSE_GENERATED,
        HttpStatusCode.OK,
      );
    } catch (error) {
      return next(error);
    }
  };
}
