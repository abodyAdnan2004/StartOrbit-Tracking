import { toFormData } from 'axios'
import axiosIns from './axios'

export class FileService {
  private baseUrl = '/file'
  async uploadFile(file: File | File[] | FileList) {
    const formData = new FormData()

    if (!file) return undefined

    if (Array.isArray(file) || file instanceof FileList) {
      formData.append('files', file[0])
    } else {
      formData.append('file', file)
    }
    const res = await axiosIns.post('/file', formData)
    return res.data
  }

  async uploadFiles(files: File[]) {
    // to be fixed

    if (!files) return undefined
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) formData.append('files', files[i])

    const res = await axiosIns.post('/file/multi', formData)
    return res.data.data
  }
  async fetchSignedUrl(imageKey: string): Promise<string> {
    try {
      if (!imageKey) return ''

      const response = await axiosIns.get(`${this.baseUrl}`, {
        params: {
          key: imageKey,
        },
      })

      return response.data.trim()
    } catch (error) {
      return ''
    }
  }
}
