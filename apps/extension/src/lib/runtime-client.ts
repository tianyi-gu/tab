import type { BackgroundRequest, BackgroundResponse } from "../types/messages"

export function sendBackgroundMessage<T>(request: BackgroundRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(request, (response: BackgroundResponse<T>) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response) {
        reject(new Error("No response from background service worker"))
        return
      }

      if (!response.ok) {
        reject(new Error(response.error))
        return
      }

      resolve(response.data)
    })
  })
}
