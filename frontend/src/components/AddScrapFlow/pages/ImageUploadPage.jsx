import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../../../modules/shared/utils/api';
import { useAuth } from '../../../modules/shared/context/AuthContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { compressImages } from '../../../modules/shared/utils/imageCompressor';

const ImageUploadPage = () => {
  const staticTexts = [
    "Upload Scrap Images",
    "Step 3 of 5",
    "Selected Categories:",
    "Drag & drop images here or click to browse",
    "Choose from Gallery",
    "Add More Images",
    "Uploading...",
    "Continue with",
    "Image",
    "Images",
    "Upload at least one image for each category to continue",
    "Please login again to upload images.",
    "Failed to upload images. Please try again.",
    "Plastic", "Metal", "Paper", "Electronics",
    "Copper", "Aluminium", "Steel", "Brass",
    "Take Photo"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // One file input ref per category (keyed by catId)
  const fileInputRefs = useRef({});

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Per-category images: { [catId]: [{ id, file, preview, name }] }
  const [categoryImages, setCategoryImages] = useState({});

  // Drag state per category
  const [draggingOver, setDraggingOver] = useState(null);

  // Guard: require auth and selected categories
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true });
      return;
    }
    const stored = sessionStorage.getItem('selectedCategories');
    const storedImages = sessionStorage.getItem('uploadedImages');

    if (stored) {
      const cats = JSON.parse(stored);
      setSelectedCategories(cats);
      
      // Init arrays per category
      const init = {};
      cats.forEach(cat => { init[cat.id] = []; });

      // Hydrate from sessionStorage if images already exist
      if (storedImages) {
        try {
          const images = JSON.parse(storedImages);
          images.forEach(img => {
            if (img.categoryId && init[img.categoryId]) {
              // Ensure we maintain the image structure expected by the UI
              init[img.categoryId].push({
                ...img,
                id: img.id || Math.random(),
                preview: img.preview || img.url
              });
            }
          });
        } catch (err) {
          console.error("Error parsing stored images:", err);
        }
      }

      setCategoryImages(init);
    } else {
      navigate('/user/add-scrap/category', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Total image count across all categories
  const totalImageCount = Object.values(categoryImages).reduce((sum, imgs) => sum + imgs.length, 0);
  // Mandatory: Every selected category must have at least one image
  const allCategoriesHaveImages = selectedCategories.every(cat => categoryImages[cat.id] && categoryImages[cat.id].length > 0);
  const canContinue = allCategoriesHaveImages;

  // Add images to a specific category
  const handleFileSelect = (catId, files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCategoryImages(prev => ({
          ...prev,
          [catId]: [
            ...(prev[catId] || []),
            {
              id: Date.now() + Math.random(),
              file,
              preview: e.target.result,
              name: file.name,
              categoryId: catId,
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (catId, e) => {
    if (e.target.files) handleFileSelect(catId, e.target.files);
  };

  const handleRemoveImage = (catId, imageId) => {
    setCategoryImages(prev => ({
      ...prev,
      [catId]: prev[catId].filter(img => img.id !== imageId)
    }));
  };

  const handleDragOver = (e, catId) => {
    e.preventDefault();
    setDraggingOver(catId);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDraggingOver(null);
  };

  const handleDrop = (e, catId) => {
    e.preventDefault();
    setDraggingOver(null);
    if (e.dataTransfer.files) handleFileSelect(catId, e.dataTransfer.files);
  };

  const handleNativeCamera = (catId) => {
    if (window.flutter_inappwebview) {
      window.flutter_inappwebview.callHandler('openCamera').then((result) => {
        if (result && result.success) {
          fetch(`data:${result.mimeType};base64,${result.base64}`)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], result.fileName, { type: result.mimeType });
              handleFileSelect(catId, [file]);
            });
        }
      }).catch(err => console.error("Camera handler error:", err));
    } else {
      const ref = fileInputRefs.current[catId];
      if (ref) {
        ref.setAttribute('capture', 'environment');
        ref.click();
      }
    }
  };

  const handleContinue = async () => {
    if (!canContinue || isUploading) return;
    setIsUploading(true);

    try {
      // Flatten all images, tagged with categoryId
      const allImages = Object.entries(categoryImages).flatMap(([catId, imgs]) =>
        imgs.map(img => ({ ...img, categoryId: catId }))
      );

      // Separate new files from already uploaded ones
      const imagesToUpload = allImages.filter(img => img.file);
      const alreadyUploaded = allImages.filter(img => !img.file);

      let finalImagesData = [...alreadyUploaded];

      if (imagesToUpload.length > 0) {
        const rawFiles = imagesToUpload.map(img => img.file);
        const compressed = await compressImages(rawFiles);
        const res = await uploadAPI.uploadOrderImages(compressed);
        const uploaded = res.data?.files || [];

        const newlyUploaded = uploaded.map((file, idx) => ({
          id: imagesToUpload[idx]?.id || file.publicId || file.url,
          preview: file.url,
          name: imagesToUpload[idx]?.name || file.publicId || 'image',
          url: file.url,
          publicId: file.publicId,
          categoryId: imagesToUpload[idx]?.categoryId || null,
        }));

        finalImagesData = [...finalImagesData, ...newlyUploaded];
      }

      sessionStorage.setItem('uploadedImages', JSON.stringify(finalImagesData));
      navigate('/user/add-scrap/address');
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.status === 401) {
        alert(getTranslatedText('Please login again to upload images.'));
        navigate('/auth/login', { replace: true });
      } else {
        alert(getTranslatedText(error.message || 'Failed to upload images. Please try again.'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: '#f4ebe2' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-6 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
        <button
          onClick={() => navigate('/user/add-scrap/weight')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-lg md:text-2xl font-bold" style={{ color: '#2d3748' }}>
          {getTranslatedText("Upload Scrap Images")}
        </h2>
        <div className="w-10"></div>
      </div>

      {/* Progress */}
      <div className="px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: '40%' }}
              animate={{ width: '60%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#38bdf8' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 3 of 5")}</span>
        </div>
      </div>

      {/* Per-Category Upload Sections */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-28 space-y-5">
        {selectedCategories.map((cat) => {
          const imgs = categoryImages[cat.id] || [];
          const isDragging = draggingOver === cat.id;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{ backgroundColor: '#ffffff' }}
            >
              {/* Category Header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: 'rgba(56,189,248,0.08)', borderBottom: '1px solid rgba(56,189,248,0.15)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📦</span>
                  <span className="text-sm font-bold" style={{ color: '#2d3748' }}>
                    {getTranslatedText(cat.name)}
                  </span>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: imgs.length > 0 ? 'rgba(56,189,248,0.15)' : 'rgba(203,213,225,0.4)', color: imgs.length > 0 ? '#38bdf8' : '#94a3b8' }}
                >
                  {imgs.length} {imgs.length === 1 ? getTranslatedText('Image') : getTranslatedText('Images')}
                </span>
              </div>

              <div className="p-3 md:p-4">
                {/* Existing images grid */}
                {imgs.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                    {imgs.map((image, index) => (
                      <motion.div
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: index * 0.05 }}
                        className="relative aspect-square rounded-xl overflow-hidden shadow-md"
                      >
                        <img src={image.preview} alt={image.name} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(cat.id, image.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
                          style={{ backgroundColor: 'rgba(229, 62, 62, 0.9)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Drop zone / Add area */}
                <div
                  onDragOver={(e) => handleDragOver(e, cat.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cat.id)}
                  className="rounded-xl border-2 border-dashed transition-all duration-200 p-3"
                  style={{
                    borderColor: isDragging ? '#38bdf8' : 'rgba(100,148,110,0.3)',
                    backgroundColor: isDragging ? 'rgba(56,189,248,0.06)' : 'rgba(248,250,252,0.8)'
                  }}
                >
                  {imgs.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center py-4 gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(56,189,248,0.1)' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: '#38bdf8' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-xs text-center" style={{ color: '#718096' }}>
                        {getTranslatedText("Drag & drop images here or click to browse")}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const ref = fileInputRefs.current[cat.id];
                            if (ref) { ref.removeAttribute('capture'); ref.click(); }
                          }}
                          className="px-4 py-2 rounded-full text-xs font-semibold transition-all"
                          style={{ backgroundColor: '#38bdf8', color: '#ffffff' }}
                        >
                          {getTranslatedText("Choose from Gallery")}
                        </button>
                        <button
                          onClick={() => handleNativeCamera(cat.id)}
                          className="px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all"
                          style={{ borderColor: '#38bdf8', color: '#38bdf8', backgroundColor: '#ffffff' }}
                        >
                          {getTranslatedText("Take Photo")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Add more row */
                    <button
                      onClick={() => {
                        const ref = fileInputRefs.current[cat.id];
                        if (ref) { ref.removeAttribute('capture'); ref.click(); }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-all"
                      style={{ color: '#38bdf8' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      {getTranslatedText("Add More Images")}
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden file input per category */}
              <input
                ref={(el) => { if (el) fileInputRefs.current[cat.id] = el; }}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileInputChange(cat.id, e)}
                className="hidden"
              />
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t z-50"
        style={{ borderColor: 'rgba(100, 148, 110, 0.2)', backgroundColor: '#f4ebe2' }}
      >
        {canContinue ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleContinue}
            disabled={isUploading}
            className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
            style={{ backgroundColor: '#38bdf8' }}
            onMouseEnter={(e) => { if (!isUploading) e.target.style.backgroundColor = '#5a8263'; }}
            onMouseLeave={(e) => { if (!isUploading) e.target.style.backgroundColor = '#38bdf8'; }}
          >
            {isUploading
              ? getTranslatedText('Uploading...')
              : `${getTranslatedText("Continue with")} ${totalImageCount} ${totalImageCount === 1 ? getTranslatedText('Image') : getTranslatedText('Images')}`
            }
          </motion.button>
        ) : (
          <p className="text-xs md:text-sm text-center" style={{ color: '#718096' }}>
            {getTranslatedText("Upload at least one image for each category to continue")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ImageUploadPage;
