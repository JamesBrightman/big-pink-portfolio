export interface UploadFormProps {
  folderOptions: string[];
}

export type DirectoryHandle = FileSystemDirectoryHandle;

export interface DirectoryPickerWindow extends Window {
  showDirectoryPicker?: (options?: {
    mode?: "read" | "readwrite";
  }) => Promise<DirectoryHandle>;
}

export interface ImageBitmapWithOrientationOptions extends ImageBitmapOptions {
  imageOrientation?: "from-image" | "flipY" | "none";
}
