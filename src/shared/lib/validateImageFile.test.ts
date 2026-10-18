import { describe, expect, it } from 'vitest'
import { validateImageFile } from './validateImageFile'

const acceptedTypes = ['image/jpeg', 'image/png'] as const
const maxSizeBytes = 2 * 1024 * 1024
const image = (type: string, size = 1) => new File([new Uint8Array(size)], 'image.jpg', { type })

describe('validateImageFile', () => {
  it.each(acceptedTypes)('accepts %s', (type) => {
    expect(validateImageFile(image(type), acceptedTypes, maxSizeBytes)).toBeNull()
  })

  it.each(['image/gif', 'text/plain', ''])('rejects MIME %s regardless of extension', (type) => {
    expect(validateImageFile(image(type), acceptedTypes)).toEqual(expect.any(String))
  })

  it('accepts exactly 2097152 bytes and rejects 2097153 bytes', () => {
    expect(
      validateImageFile(image('image/png', maxSizeBytes), acceptedTypes, maxSizeBytes),
    ).toBeNull()
    expect(
      validateImageFile(image('image/png', maxSizeBytes + 1), acceptedTypes, maxSizeBytes),
    ).toEqual(expect.any(String))
  })

  it('does not limit size when maxSizeBytes is omitted', () => {
    expect(validateImageFile(image('image/jpeg', maxSizeBytes + 1), acceptedTypes)).toBeNull()
  })

  it('uses the supplied types and limit, including zero', () => {
    expect(validateImageFile(image('image/gif', 0), ['image/gif'], 0)).toBeNull()
    expect(validateImageFile(image('image/gif'), ['image/gif'], 0)).toEqual(expect.any(String))
    expect(validateImageFile(image('image/jpeg'), [])).toEqual(expect.any(String))
  })
})
