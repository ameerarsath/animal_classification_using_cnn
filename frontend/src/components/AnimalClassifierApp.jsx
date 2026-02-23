import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader, CheckCircle, Trash2, Sparkles, Brain, Eye, Target, X, Plus, BarChart3 } from 'lucide-react';

// Real API call to the FastAPI backend /predict endpoint
const API_BASE = 'http://localhost:8000';

const analyzeImage = async (imageFile, imageId) => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const startTime = performance.now();

  const response = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Server error: ${response.status}`);
  }

  const data = await response.json();
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

  // Map backend response to component model
  return {
    id: imageId,
    breed: data.predicted_breed,
    confidence: data.confidence.toFixed(1),
    top5: data.top_5_predictions,
    detectionStages: [
      { stage: "Image Preprocessing", progress: 100, time: 0.3, description: "Resizing to 224×224 and normalizing pixels" },
      { stage: "Feature Extraction", progress: 100, time: 0.6, description: "MobileNetV2 convolutional feature maps" },
      { stage: "Pattern Recognition", progress: 100, time: 0.9, description: "Identifying breed-specific visual patterns" },
      { stage: "Classification", progress: 100, time: parseFloat(elapsed), description: "Softmax prediction across 50 breeds" }
    ],
    calculations: {
      inputResolution: "224 × 224 (50,176 pixels)",
      processingTime: elapsed + "s",
      modelArchitecture: "MobileNetV2",
      totalClasses: "50 Indian cattle breeds"
    }
  };
};

export default function CattleClassifierMultiple() {
  const [images, setImages] = useState([]);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Animate detection stages for analyzing images
    images.forEach((img) => {
      if (img.analyzing && img.result) {
        const interval = setInterval(() => {
          setImages(prevImages =>
            prevImages.map(prevImg => {
              if (prevImg.id === img.id && prevImg.currentStage < prevImg.result.detectionStages.length - 1) {
                return { ...prevImg, currentStage: prevImg.currentStage + 1 };
              }
              return prevImg;
            })
          );
        }, 800);

        setTimeout(() => clearInterval(interval), 4000);
      }
    });
  }, [images]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const newImages = files.map((file, index) => {
      const reader = new FileReader();
      const imageId = Date.now() + index;

      reader.onload = (e) => {
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === imageId ? { ...img, preview: e.target.result } : img
          )
        );
      };
      reader.readAsDataURL(file);

      return {
        id: imageId,
        file: file,
        preview: null,
        analyzing: false,
        result: null,
        currentStage: 0,
        error: null
      };
    });

    setImages(prevImages => [...prevImages, ...newImages]);
  };

  const handleAnalyzeImage = async (imageId) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    setImages(prevImages =>
      prevImages.map(img =>
        img.id === imageId ? { ...img, analyzing: true, currentStage: 0, error: null } : img
      )
    );

    try {
      const result = await analyzeImage(image.file, imageId);

      setImages(prevImages =>
        prevImages.map(img =>
          img.id === imageId ? { ...img, result: result } : img
        )
      );

      setTimeout(() => {
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === imageId ? { ...img, analyzing: false } : img
          )
        );
      }, 2000);
    } catch (err) {
      setImages(prevImages =>
        prevImages.map(img =>
          img.id === imageId ? { ...img, analyzing: false, error: err.message || 'Analysis failed' } : img
        )
      );
    }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzingAll(true);

    const unanalyzedImages = images.filter(img => !img.result);

    for (const image of unanalyzedImages) {
      await handleAnalyzeImage(image.id);
    }

    setAnalyzingAll(false);
  };

  const handleRemoveImage = (imageId) => {
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
  };

  const handleReset = () => {
    setImages([]);
    setExpandedImage(null);
  };

  const getOverallStats = () => {
    const analyzed = images.filter(img => img.result);
    const uniqueBreeds = new Set(analyzed.map(img => img.result.breed)).size;
    const avgConfidence = analyzed.length > 0
      ? (analyzed.reduce((sum, img) => sum + parseFloat(img.result.confidence), 0) / analyzed.length).toFixed(1)
      : 0;

    return { total: images.length, analyzed: analyzed.length, uniqueBreeds, avgConfidence };
  };

  const stats = getOverallStats();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(139, 92, 46, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(205, 133, 63, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeInDown 0.8s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Brain style={{ width: '48px', height: '48px', color: '#CD853F' }} />
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #CD853F 0%, #DEB887 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0,
              letterSpacing: '-0.02em'
            }}>
              Sysdak AI
            </h1>
          </div>
          <p style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '0.5rem 0 0 0',
            fontWeight: '300',
            letterSpacing: '0.05em'
          }}>
            Batch Cattle Breed Classification System — 50 Breeds
          </p>
        </div>

        {/* Stats Bar */}
        {images.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
            animation: 'fadeIn 0.6s ease-out'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#CD853F' }}>{stats.total}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>Total Images</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#4CAF50' }}>{stats.analyzed}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>Analyzed</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#DEB887' }}>{stats.uniqueBreeds}</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>Unique Breeds</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#66BB6A' }}>{stats.avgConfidence}%</div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>Avg Confidence</div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#DEB887',
            marginBottom: '1.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Upload size={24} /> Upload Multiple Images
          </h2>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `3px dashed ${dragActive ? '#CD853F' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '16px',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: dragActive ? 'rgba(205, 133, 63, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              transform: dragActive ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleChange}
              style={{ display: 'none' }}
            />
            <Plus style={{ width: '64px', height: '64px', color: '#CD853F', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.25rem', color: 'white', marginBottom: '0.5rem', fontWeight: '600' }}>
              {dragActive ? 'Drop your images here' : 'Click or drag to upload multiple images'}
            </p>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              Supports: JPG, PNG, WEBP • Upload as many as you need
            </p>
          </div>

          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleAnalyzeAll}
                disabled={analyzingAll || stats.analyzed === stats.total}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: (analyzingAll || stats.analyzed === stats.total) ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #CD853F 0%, #B8860B 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  cursor: (analyzingAll || stats.analyzed === stats.total) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: (analyzingAll || stats.analyzed === stats.total) ? 'none' : '0 4px 20px rgba(205, 133, 63, 0.4)'
                }}
                onMouseEnter={(e) => !(analyzingAll || stats.analyzed === stats.total) && (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => !(analyzingAll || stats.analyzed === stats.total) && (e.currentTarget.style.transform = 'scale(1)')}
              >
                {analyzingAll ? (
                  <>
                    <Loader style={{ animation: 'spin 1s linear infinite' }} size={20} />
                    Analyzing All Images...
                  </>
                ) : stats.analyzed === stats.total ? (
                  <>
                    <CheckCircle size={20} />
                    All Images Analyzed
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Analyze All ({stats.total - stats.analyzed} remaining)
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            animation: 'fadeIn 0.6s ease-out'
          }}>
            {images.map((image, index) => (
              <div
                key={image.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`,
                  position: 'relative'
                }}
              >
                {/* Image Preview */}
                <div style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '1rem',
                  border: '2px solid rgba(205, 133, 63, 0.3)'
                }}>
                  {image.preview ? (
                    <>
                      <img
                        src={image.preview}
                        alt={`Upload ${index + 1}`}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                      />
                      {image.analyzing && (
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Eye style={{
                            width: '40px',
                            height: '40px',
                            color: '#CD853F',
                            animation: 'pulse 1.5s ease-in-out infinite'
                          }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Loader style={{ animation: 'spin 1s linear infinite', color: '#CD853F' }} size={32} />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveImage(image.id)}
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: 'rgba(244, 67, 54, 0.9)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 67, 54, 1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 67, 54, 0.9)'}
                >
                  <Trash2 size={18} style={{ color: 'white' }} />
                </button>

                {/* Analysis Button */}
                {!image.result && !image.analyzing && (
                  <button
                    onClick={() => handleAnalyzeImage(image.id)}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      background: 'linear-gradient(135deg, #CD853F 0%, #B8860B 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(205, 133, 63, 0.4)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Sparkles size={18} />
                    Analyze This Image
                  </button>
                )}

                {/* Error Display for failed analysis */}
                {image.error && !image.result && !image.analyzing && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(244, 67, 54, 0.15)',
                    borderRadius: '10px',
                    border: '1px solid rgba(244, 67, 54, 0.4)',
                    color: '#ef5350',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    ⚠ {image.error}
                    <button
                      onClick={() => handleAnalyzeImage(image.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(205, 133, 63, 0.3)',
                        color: '#DEB887',
                        border: '1px solid rgba(205, 133, 63, 0.5)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}
                    >
                      Retry Analysis
                    </button>
                  </div>
                )}

                {/* Detection Progress */}
                {image.analyzing && image.result && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{
                      fontSize: '0.9rem',
                      color: '#DEB887',
                      marginBottom: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Target size={16} /> Detection Process
                    </h4>
                    {image.result.detectionStages.map((stage, stageIndex) => (
                      <div
                        key={stageIndex}
                        style={{
                          marginBottom: '0.75rem',
                          opacity: stageIndex <= image.currentStage ? 1 : 0.3,
                          transition: 'opacity 0.5s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ color: 'white', fontWeight: '600', fontSize: '0.8rem' }}>
                            {stage.stage}
                          </span>
                          {stageIndex <= image.currentStage && (
                            <CheckCircle size={14} style={{ color: '#4CAF50' }} />
                          )}
                        </div>
                        <div style={{
                          height: '5px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #CD853F 0%, #DEB887 100%)',
                            width: stageIndex <= image.currentStage ? '100%' : '0%',
                            transition: 'width 0.8s ease',
                            borderRadius: '3px'
                          }} />
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem', marginBottom: 0 }}>
                          {stage.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Results Display */}
                {image.result && !image.analyzing && (
                  <div style={{ marginTop: '1rem' }}>
                    {/* Main Result */}
                    <div style={{
                      padding: '1rem',
                      background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.2) 0%, rgba(184, 134, 11, 0.2) 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(205, 133, 63, 0.3)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <CheckCircle size={24} style={{ color: '#4CAF50', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.2rem', color: 'white', margin: 0, fontWeight: '800' }}>
                            {image.result.breed}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: '#CD853F', margin: '0.25rem 0 0 0', fontWeight: '600' }}>
                            Cattle Breed
                          </p>
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'center',
                        padding: '0.625rem',
                        background: 'rgba(76, 175, 80, 0.2)',
                        borderRadius: '8px',
                        border: '1px solid rgba(76, 175, 80, 0.3)'
                      }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#4CAF50', lineHeight: 1 }}>
                          {image.result.confidence}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.25rem' }}>
                          Confidence
                        </div>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => setExpandedImage(image)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                      <BarChart3 size={18} />
                      View Detailed Analysis
                    </button>

                    {/* Error Display */}
                    {image.error && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(244, 67, 54, 0.15)',
                        borderRadius: '10px',
                        border: '1px solid rgba(244, 67, 54, 0.4)',
                        color: '#ef5350',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        ⚠ {image.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Expanded Detail Modal */}
        {expandedImage && expandedImage.result && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => setExpandedImage(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, #0f2027 0%, #203a43 100%)',
                borderRadius: '24px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
                animation: 'scaleIn 0.4s ease-out',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setExpandedImage(null)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  zIndex: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <X size={24} style={{ color: 'white' }} />
              </button>

              <div style={{ padding: '2.5rem' }}>
                <h2 style={{
                  fontSize: '2rem',
                  color: '#DEB887',
                  marginBottom: '2rem',
                  fontWeight: '800'
                }}>
                  Detailed Analysis Report
                </h2>

                {/* Image Preview */}
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  marginBottom: '2rem',
                  border: '2px solid rgba(205, 133, 63, 0.3)'
                }}>
                  <img
                    src={expandedImage.preview}
                    alt="Analyzed"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>

                {/* Classification Result */}
                <div style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(205, 133, 63, 0.2) 0%, rgba(184, 134, 11, 0.2) 100%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(205, 133, 63, 0.3)',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.8rem', color: 'white', margin: 0, fontWeight: '800' }}>
                        {expandedImage.result.breed}
                      </h3>
                      <p style={{ fontSize: '1.1rem', color: '#CD853F', margin: '0.5rem 0 0 0', fontWeight: '600' }}>
                        Cattle Breed
                      </p>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '1rem 1.5rem',
                      background: 'rgba(76, 175, 80, 0.2)',
                      borderRadius: '12px',
                      border: '1px solid rgba(76, 175, 80, 0.3)'
                    }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#4CAF50', lineHeight: 1 }}>
                        {expandedImage.result.confidence}%
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '0.5rem' }}>
                        Confidence
                      </div>
                    </div>
                  </div>
                </div>

                {/* Model Calculations */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h4 style={{ fontSize: '1.3rem', color: '#DEB887', marginBottom: '1rem', fontWeight: '700' }}>
                    Model Calculations
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    {Object.entries(expandedImage.result.calculations).map(([key, value], idx) => (
                      <div key={idx} style={{
                        padding: '1rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                          {key.split(/(?=[A-Z])/).join(' ').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: 'white', fontWeight: '700' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 5 Predictions */}
                {expandedImage.result.top5 && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <h4 style={{ fontSize: '1.3rem', color: '#DEB887', marginBottom: '1rem', fontWeight: '700' }}>
                      Top 5 Predictions
                    </h4>
                    {expandedImage.result.top5.map((pred, idx) => (
                      <div key={idx} style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                              color: idx === 0 ? '#4CAF50' : 'rgba(255, 255, 255, 0.5)',
                              fontWeight: '800',
                              fontSize: '1.1rem',
                              minWidth: '24px'
                            }}>
                              #{idx + 1}
                            </span>
                            <span style={{ color: 'white', fontWeight: '600', fontSize: '1rem' }}>
                              {pred.breed}
                            </span>
                          </div>
                          <span style={{ color: '#CD853F', fontWeight: '700', fontSize: '1.2rem' }}>
                            {pred.confidence}%
                          </span>
                        </div>
                        <div style={{
                          height: '12px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            background: `linear-gradient(90deg, 
                              ${idx === 0 ? '#4CAF50' : idx < 3 ? '#CD853F' : '#FF9800'} 0%, 
                              ${idx === 0 ? '#66BB6A' : idx < 3 ? '#DEB887' : '#FFB74D'} 100%
                            )`,
                            width: `${pred.confidence}%`,
                            transition: 'width 1s ease',
                            borderRadius: '6px',
                            boxShadow: `0 0 12px ${idx === 0 ? 'rgba(76, 175, 80, 0.6)' : 'rgba(205, 133, 63, 0.4)'}`
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detection Stages */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <h4 style={{ fontSize: '1.3rem', color: '#DEB887', marginBottom: '1rem', fontWeight: '700' }}>
                    Detection Pipeline
                  </h4>
                  {expandedImage.result.detectionStages.map((stage, idx) => (
                    <div key={idx} style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'white', fontWeight: '700', fontSize: '1rem' }}>
                          Stage {idx + 1}: {stage.stage}
                        </span>
                        <span style={{ color: '#4CAF50', fontSize: '0.9rem', fontWeight: '600' }}>
                          {stage.time}s
                        </span>
                      </div>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                        {stage.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap');
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
