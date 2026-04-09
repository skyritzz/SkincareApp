export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateClaudeResponse(response: any) {
  if (!response || typeof response !== 'object') {
    throw new InvalidResponseError("Couldn't read the analysis. Please try again.");
  }
  if (!Array.isArray(response.ingredients)) {
    throw new InvalidResponseError("Couldn't read the analysis. Please try again.");
  }
  if (typeof response.overall_score !== 'number') {
    throw new InvalidResponseError("Couldn't read the analysis. Please try again.");
  }
  return response;
}

export function validateIngredientText(text: string) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new ValidationError("Please enter some ingredients first.");
  }
  if (trimmed.length < 10) {
    throw new ValidationError("That seems too short. Please paste the full ingredients list.");
  }
  if (trimmed.length > 5000) {
    throw new ValidationError("Ingredients list is too long. Please trim it down.");
  }
  return trimmed;
}