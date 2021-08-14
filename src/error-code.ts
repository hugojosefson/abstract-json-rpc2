export enum ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

export const errorCodeMeanings: Record<ErrorCode, string> = {
  [ErrorCode.ParseError]:
    "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.",
  [ErrorCode.InvalidRequest]: "The JSON sent is not a valid Request object.",
  [ErrorCode.MethodNotFound]: "The method does not exist / is not available.",
  [ErrorCode.InvalidParams]: "Invalid method parameter(s).",
  [ErrorCode.InternalError]: "Internal JSON-RPC error.",
};
