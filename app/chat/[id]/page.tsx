[{
	"resource": "/c:/Users/Reda/reda-chat/app/api/messages/send/route.ts",
	"owner": "typescript",
	"code": "2353",
	"severity": 8,
	"message": "Object literal may only specify known properties, and 'type' does not exist in type '(Without<MessageCreateInput, MessageUncheckedCreateInput> & MessageUncheckedCreateInput) | (Without<...> & MessageCreateInput)'.",
	"source": "ts",
	"startLineNumber": 23,
	"startColumn": 9,
	"endLineNumber": 23,
	"endColumn": 13,
	"relatedInformation": [
		{
			"startLineNumber": 8172,
			"startColumn": 5,
			"endLineNumber": 8172,
			"endColumn": 9,
			"message": "The expected type comes from property 'data' which is declared here on type '{ select?: MessageSelect<DefaultArgs> | null | undefined; include?: MessageInclude<DefaultArgs> | null | undefined; data: (Without<...> & MessageUncheckedCreateInput) | (Without<...> & MessageCreateInput); }'",
			"resource": "/c:/Users/Reda/reda-chat/node_modules/.prisma/client/index.d.ts"
		}
	],
	"modelVersionId": 19,
	"origin": "extHost1"
}]