import React from 'react';

interface ImageManagerProps {
  title: string;
  inputName: 'background' | 'galery' | 'routes' | 'card';
  isMultiple: boolean;
  isDisabled: boolean;
  existingUrls: string[];
  errorMessage?: string | null;
  newFiles: File[];
  urlsToDelete: string[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewUrl: (fileToRemove: File) => void;
  onToggleDeleteUrl: (url: string) => void;
}

const UrlChip = ({ url, isMarkedForDeletion, onToggle }: { url: string; isMarkedForDeletion: boolean; onToggle: () => void; }) => (
  <div className={`flex items-center border rounded-md overflow-hidden transition-all duration-200 ${isMarkedForDeletion ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}>
    <a href={url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs text-blue-600 hover:underline truncate" title={url}>
      {url.split('/').pop()}
    </a>
    <button
      type="button"
      onClick={onToggle}
      className={`px-2 py-1 text-sm font-bold ${isMarkedForDeletion ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
      title={isMarkedForDeletion ? "Restaurar URL" : "Marcar para eliminar"}
    >
      {isMarkedForDeletion ? '↶' : '×'}
    </button>
  </div>
);

const NewFileChip = ({ file, onRemove }: { file: File; onRemove: () => void; }) => (
  <div className="flex items-center border border-green-300 bg-green-50 rounded-md overflow-hidden">
    <span className="px-3 py-1 text-xs text-green-800 truncate" title={file.name}>
      {file.name}
    </span>
    <button
      type="button"
      onClick={onRemove}
      className="px-2 py-1 text-sm font-bold bg-green-200 text-green-800 hover:bg-green-300"
      title="Quitar archivo de la selección"
    >
      ×
    </button>
  </div>
);

export default function ImageManager({
  title,
  inputName,
  isMultiple,
  isDisabled,
  existingUrls,
  errorMessage,
  newFiles,
  urlsToDelete,
  onFileChange,
  onRemoveNewUrl,
  onToggleDeleteUrl,
}: ImageManagerProps) {

  const hasExistingUrls = existingUrls && existingUrls.length > 0;
  const hasNewFiles = newFiles && newFiles.length > 0;

  return (
    <div>
      <label htmlFor={inputName} className="block text-sm font-medium text-gray-700">{title}</label>
      <input
        type="file"
        id={inputName}
        name={inputName}
        multiple={isMultiple}
        onChange={onFileChange}
        disabled={isDisabled}
        className="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:file:bg-blue-50"
      />

      {errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}

      {(hasExistingUrls || hasNewFiles) && (
        <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50 space-y-3">
          {hasExistingUrls && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 mb-2">Imágenes Actuales:</h5>
              <div className="flex flex-wrap gap-2">
                {existingUrls.map(url => (
                  <UrlChip
                    key={url}
                    url={url}
                    isMarkedForDeletion={urlsToDelete.includes(url)}
                    onToggle={() => onToggleDeleteUrl(url)}
                  />
                ))}
              </div>
            </div>
          )}

          {hasNewFiles && (
            <div>
              <h5 className="text-xs font-semibold text-green-700 mb-2">Nuevos Archivos para Subir:</h5>
              <div className="flex flex-wrap gap-2">
                {newFiles.map((file, index) => (
                  <NewFileChip
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    onRemove={() => onRemoveNewUrl(file)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}