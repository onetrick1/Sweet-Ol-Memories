"use server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const getDate = async (datetime: string) => {
	const model = openai("gpt-4o-mini");

	const currentDateTime = new Date().toISOString();

	const { text } = await generateText({
		model: model,
		prompt: `Convert the relative datetime expression to an absolute datetime in ISO format (YYYY-MM-DDTHH:mm:ssZ).
        Current time is: ${currentDateTime}
        Input datetime: ${datetime}
        
        Only return the datetime in ISO format (YYYY-MM-DDTHH:mm:ssZ). For example:
        - If input is "today at 2pm" and current time is "2024-03-20T10:30:00Z", return "2024-03-20T14:00:00Z"
        - If input is "after 10 mins" and current time is "2024-03-20T10:30:00Z", return "2024-03-20T10:40:00Z"
        - If input is "tomorrow morning at 9am" and current time is "2024-03-20T23:30:00Z", return "2024-03-21T09:00:00Z"
        - If input is "next monday 3pm" and current time is "2024-03-20T10:30:00Z", return "2024-03-25T15:00:00Z"`,
	});

	return text;
};
