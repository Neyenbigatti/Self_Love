"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExplorationPhoto } from "@/lib/types";

type PhotoAngle = ExplorationPhoto["angle"];

const photoAngles: { id: PhotoAngle; label: string; icon: React.ReactNode }[] = [
  {
    id: "front",
    label: "Frontal",
    icon: (
      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="8" r="4" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      </svg>
    ),
  },
  {
    id: "left",
    label: "Left Profile",
    icon: (
      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12H4m5 0l-2-2m2 2l-2 2" />
      </svg>
    ),
  },
  {
    id: "right",
    label: "Right Profile",
    icon: (
      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12h5m-5 0l2-2m-2 2l2 2" />
      </svg>
    ),
  },
  {
    id: "up",
    label: "Looking Up",
    icon: (
      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5V2m0 3l-2-2m2 2l2-2" />
      </svg>
    ),
  },
  {
    id: "down",
    label: "Looking Down",
    icon: (
      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19v3m0-3l-2 2m2-2l2 2" />
      </svg>
    ),
  },
];

interface PhotoCaptureProps {
  photos: ExplorationPhoto[];
  onPhotosChange: (photos: ExplorationPhoto[]) => void;
  initialData?: ExplorationPhoto[];
}

export function PhotoCapture({ photos, onPhotosChange, initialData }: PhotoCaptureProps) {
  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>("front");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  // Merge initialData into photos on mount (for editing existing exploration)
  useEffect(() => {
    if (!hasInitialized.current && initialData && initialData.length > 0 && photos.length === 0) {
      onPhotosChange(initialData);
      hasInitialized.current = true;
    }
  }, [initialData, onPhotosChange, photos.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local URL for the file
    const url = URL.createObjectURL(file);
    
    const newPhoto: ExplorationPhoto = {
      id: `photo-${Date.now()}`,
      url,
      angle: selectedAngle,
      date: new Date(),
    };

    // Replace existing photo for this angle or add new one
    const existingIndex = photos.findIndex((p) => p.angle === selectedAngle);
    if (existingIndex >= 0) {
      const newPhotos = [...photos];
      // Revoke old URL to prevent memory leaks
      URL.revokeObjectURL(photos[existingIndex].url);
      newPhotos[existingIndex] = newPhoto;
      onPhotosChange(newPhotos);
    } else {
      onPhotosChange([...photos, newPhoto]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (angle: PhotoAngle) => {
    const photo = photos.find((p) => p.angle === angle);
    if (photo) {
      URL.revokeObjectURL(photo.url);
    }
    onPhotosChange(photos.filter((p) => p.angle !== angle));
  };

  const getPhotoForAngle = (angle: PhotoAngle) => photos.find((p) => p.angle === angle);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Photo Documentation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Angle selection */}
        <div className="grid grid-cols-5 gap-2">
          {photoAngles.map((angle) => {
            const hasPhoto = !!getPhotoForAngle(angle.id);
            return (
              <Button
                key={angle.id}
                variant={selectedAngle === angle.id ? "default" : "outline"}
                className={cn(
                  "flex flex-col h-auto py-3 relative",
                  hasPhoto && selectedAngle !== angle.id && "border-accent"
                )}
                onClick={() => setSelectedAngle(angle.id)}
              >
                {angle.icon}
                <span className="text-xs mt-1">{angle.label}</span>
                {hasPhoto && (
                  <span className="absolute top-1 right-1 size-2 bg-accent rounded-full" />
                )}
              </Button>
            );
          })}
        </div>

        {/* Photo preview / capture area */}
        <div className="relative aspect-[3/4] max-w-md mx-auto bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
          {getPhotoForAngle(selectedAngle) ? (
            <>
              <img
                src={getPhotoForAngle(selectedAngle)!.url}
                alt={`${selectedAngle} view`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm">
                    {photoAngles.find((a) => a.id === selectedAngle)?.label}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(selectedAngle)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <svg className="size-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-lg font-medium">
                Capture {photoAngles.find((a) => a.id === selectedAngle)?.label} Photo
              </span>
              <span className="text-sm mt-1">Click to upload or drag and drop</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Photo grid summary */}
        <div className="grid grid-cols-5 gap-2">
          {photoAngles.map((angle) => {
            const photo = getPhotoForAngle(angle.id);
            return (
              <div
                key={angle.id}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden border-2",
                  photo ? "border-accent" : "border-border bg-muted"
                )}
              >
                {photo ? (
                  <img
                    src={photo.url}
                    alt={`${angle.label} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
