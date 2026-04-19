---
description: "Add a new LLM provider to the extension. Use when: the user wants to add support for a new AI provider like DeepSeek, Ollama, or local models."
---

# Add New LLM Provider

Add a new LLM provider to `lib/llmProviders.js` following the existing pattern.

## Steps

1. **Choose provider type**: Anthropic, OpenAI, Gemini, OpenRouter, or Custom

2. **Add provider enum**: Update `LLMProviders` in `lib/constants.js`

3. **Create provider class** in `lib/llmProviders.js`:
   - Extend `LLMProvider` base class
   - Implement `_buildRequest()` to format the API payload
   - Implement `_parseResponse()` to extract message content

4. **Update factory**: Add case in `LLMProviderFactory.create()` switch statement

5. **Add settings**: Update `lib/settings.js` and `schemas/` for API key and model options

6. **Test**: Verify the new provider works in the extension

## Example Pattern

```javascript
class CustomProvider extends LLMProvider {
  _buildRequest messages, tools) {
    return {
      model: this._model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      // Custom parameters
    };
  }

  _parseResponse(response) {
    return response.choices[0].message.content;
  }
}
```

## Provider Documentation

- OpenAI: https://platform.openai.com/docs
- Anthropic: https://docs.anthropic.com
- Gemini: https://ai.google.dev/docs
- OpenRouter: https://openrouter.ai/docs