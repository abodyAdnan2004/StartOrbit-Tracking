export interface RequestPhotoModelSingle {
  file: string
  photoFileType: string
}
export type RequestPhotoModel = RequestPhotoModelSingle | RequestPhotoModelSingle[]
