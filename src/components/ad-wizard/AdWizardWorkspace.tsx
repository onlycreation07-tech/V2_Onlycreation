import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Check, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Play, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Plus, 
  FolderPlus,
  Eye,
  Type,
  Maximize2
} from 'lucide-react';
import { 
  BrandProfile, 
  AdBriefQuestionnaire, 
  CreativeDirection, 
  GeneratedAdResult,
  AdCreative
} from '../../types';

interface AdWizardWorkspaceProps {
  brandProfile: BrandProfile;
  initialBrief?: Partial<AdBriefQuestionnaire>;
  onClose: () => void;
  onConvertToProject?: (creative: AdCreative) => void;
  onNavigateToStudio?: (tab: string, prompt?: string) => void;
}

export default function AdWizardWorkspace({
  brandProfile,
  initialBrief,
  onClose,
  onConvertToProject,
  onNavigateToStudio
}: AdWizardWorkspaceProps) {
  // Wizard Steps:
  // 1: Product & Customer
  // 2: Offer, Price & Benefits
  // 3: Placement & Viewer Action
  // 4: Style, Language & Asset Uploads
  // 5: Brief Review & Propose 2 Directions
  // 6: Select Direction & Generating
  // 7: Ad Canvas Studio & Export
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [brief, setBrief] = useState<AdBriefQuestionnaire>({
    productOrService: initialBrief?.productOrService || '',
    category: initialBrief?.category || brandProfile.industry || '',
    targetCustomer: initialBrief?.targetCustomer || brandProfile.targetAudience || '',
    customerProblem: initialBrief?.customerProblem || '',
    offerAndPrice: initialBrief?.offerAndPrice || '',
    mainBenefit: initialBrief?.mainBenefit || '',
    placement: initialBrief?.placement || 'instagram_story',
    actionOrCta: initialBrief?.actionOrCta || 'shop_now',
    language: initialBrief?.language || 'English',
    visualStyle: initialBrief?.visualStyle || 'cinematic_bold',
    uploadedAssets: initialBrief?.uploadedAssets || [],
    preserveProductPhotoUnchanged: initialBrief?.preserveProductPhotoUnchanged ?? true
  });

  // Directions & Generation State
  const [isProposingDirections, setIsProposingDirections] = useState(false);
  const [proposedDirections, setProposedDirections] = useState<CreativeDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<CreativeDirection | null>(null);
  
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<GeneratedAdResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Interactive Live Canvas Editing
  const [editableHeadline, setEditableHeadline] = useState('');
  const [editableOffer, setEditableOffer] = useState('');
  const [editableCta, setEditableCta] = useState('');
  const [selectedPlacementAdapt, setSelectedPlacementAdapt] = useState(brief.placement);
  const [styleOverride, setStyleOverride] = useState(brief.visualStyle);
  const [isAdapting, setIsAdapting] = useState(false);
  const [showTextOverlays, setShowTextOverlays] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editable text with generated ad
  useEffect(() => {
    if (generatedAd) {
      setEditableHeadline(generatedAd.headline);
      setEditableOffer(generatedAd.offerText);
      setEditableCta(generatedAd.ctaText);
      setSelectedPlacementAdapt(generatedAd.placement as any);
      setStyleOverride(generatedAd.visualStyle as any);
    }
  }, [generatedAd]);

  // Redraw Canvas with custom text overlays and safe margins
  useEffect(() => {
    if (!generatedAd || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = generatedAd.imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw base AI generated commercial photo
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (!showTextOverlays) return;

      const w = canvas.width;
      const h = canvas.height;

      // Draw subtle top shadow gradient for headline legibility
      const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.35);
      topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      topGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
      topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, w, h * 0.35);

      // Draw subtle bottom shadow gradient for CTA legibility
      const botGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      botGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)');
      botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // 1. Draw Headline (with word wrap and safe margin)
      if (editableHeadline) {
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const fontSize = Math.max(28, Math.round(w * 0.055));
        ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        const maxTextWidth = w * 0.84;
        const words = editableHeadline.split(' ');
        let line = '';
        let y = h * 0.12; // 12% safe top margin (below story icons)

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxTextWidth && i > 0) {
            ctx.fillText(line.trim(), w / 2, y);
            line = words[i] + ' ';
            y += fontSize * 1.25;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), w / 2, y);
      }

      // 2. Draw Offer Text if present
      if (editableOffer) {
        ctx.fillStyle = '#FDE047'; // Bright yellow offer text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const offerFontSize = Math.max(18, Math.round(w * 0.034));
        ctx.font = `600 ${offerFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.shadowBlur = 8;
        ctx.fillText(editableOffer.toUpperCase(), w / 2, h * 0.76);
      }

      // 3. Draw CTA Button
      if (editableCta) {
        ctx.shadowBlur = 0;
        const btnFontSize = Math.max(20, Math.round(w * 0.038));
        ctx.font = `bold ${btnFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        const textMetrics = ctx.measureText(editableCta.toUpperCase());
        const btnWidth = Math.max(textMetrics.width + 48, w * 0.55);
        const btnHeight = Math.max(48, Math.round(h * 0.065));
        const btnX = (w - btnWidth) / 2;
        const btnY = h * 0.82; // 82% safe bottom margin (above swipe controls)
        const radius = 12;

        // Button background
        ctx.fillStyle = '#7C3AED'; // Sleek violet accent
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnWidth, btnHeight, radius);
        ctx.fill();

        // Button text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(editableCta.toUpperCase(), w / 2, btnY + btnHeight / 2);
      }
    };
  }, [generatedAd, editableHeadline, editableOffer, editableCta, showTextOverlays]);

  // Handle Asset Uploads
  const handleUploadAsset = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'product_photo' | 'reference') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBrief(prev => ({
        ...prev,
        uploadedAssets: [
          ...prev.uploadedAssets,
          {
            id: `asset_${Date.now()}`,
            name: file.name,
            url: result,
            type
          }
        ]
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAsset = (id: string) => {
    setBrief(prev => ({
      ...prev,
      uploadedAssets: prev.uploadedAssets.filter(a => a.id !== id)
    }));
  };

  // Step 5: Request 2 Creative Directions
  const handleSynthesizeDirections = async () => {
    setErrorMessage(null);
    setIsProposingDirections(true);
    setCurrentStep(5);

    try {
      const res = await fetch('/api/ad-wizard/propose-directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, brandProfile })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not synthesize directions');

      setProposedDirections(data.directions);
      if (data.directions.length > 0) {
        setSelectedDirection(data.directions[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to synthesize creative directions.');
    } finally {
      setIsProposingDirections(false);
    }
  };

  // Step 6: Trigger Generation
  const handleGenerateSelectedDirection = async (direction: CreativeDirection) => {
    setSelectedDirection(direction);
    setErrorMessage(null);
    setIsGeneratingAd(true);
    setCurrentStep(6);

    try {
      const res = await fetch('/api/ad-wizard/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief,
          selectedDirection: direction,
          brandProfile
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');

      setGeneratedAd(data.ad);
      setCurrentStep(7); // Move to Canvas Editor
    } catch (err: any) {
      setErrorMessage(err.message || 'Ad generation encountered an error.');
    } finally {
      setIsGeneratingAd(false);
    }
  };

  // Step 7: Generate Variation / Adapt Placement
  const handleAdaptPlacement = async () => {
    if (!generatedAd) return;
    setIsAdapting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ad-wizard/variation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingAd: generatedAd,
          targetPlacement: selectedPlacementAdapt,
          styleOverride,
          newHeadline: editableHeadline
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate variation');

      setGeneratedAd(data.ad);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not generate placement variation.');
    } finally {
      setIsAdapting(false);
    }
  };

  // Download High-Res Canvas Image
  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `OnlyCreation_Ad_${brief.productOrService.replace(/\s+/g, '_')}_${generatedAd?.aspectRatio || 'ad'}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // Convert to Workspace Project
  const handleSaveToProject = () => {
    if (!generatedAd || !onConvertToProject) return;
    const creative: AdCreative = {
      id: generatedAd.id,
      prompt: `${generatedAd.directionTitle}: ${generatedAd.headline}`,
      copy: generatedAd.supportingCopy,
      imageUrls: [generatedAd.imageUrl],
      videoScript: `Hook: "${generatedAd.headline}"\nOffer: "${generatedAd.offerText}"\nCall to Action: "${generatedAd.ctaText}"`,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    onConvertToProject(creative);
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#090D16] text-white overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-[#090D16]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Return to Home"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Create an Ad</span>
              <span className="text-[11px] text-sleek-violet font-mono bg-sleek-violet/10 px-2 py-0.5 rounded border border-sleek-violet/20">
                Step {currentStep} of 7
              </span>
            </div>
            <p className="text-[11px] text-white/40">
              Guided Creative Brief Interview & High-Converting Commercial Generator
            </p>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === currentStep 
                  ? 'w-6 bg-sleek-violet' 
                  : s < currentStep 
                    ? 'w-2 bg-emerald-500' 
                    : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-3xl">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage(null)}
                className="text-white/40 hover:text-white ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* STEP 1: PRODUCT & CUSTOMER */}
          {currentStep === 1 && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div>
                <span className="text-xs uppercase tracking-wider text-sleek-violet font-semibold">Step 1 · Creative Foundation</span>
                <h2 className="text-2xl font-bold text-white mt-1">What product or service are we advertising?</h2>
                <p className="text-sm text-white/50 mt-1">
                  Tell us about your offer and the customer problem you want to solve.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Product / Brand or Service Name *
                  </label>
                  <input
                    type="text"
                    value={brief.productOrService}
                    onChange={(e) => setBrief({ ...brief, productOrService: e.target.value })}
                    placeholder="e.g. Luminara Anamorphic Studio Master Package, Aurora Glow Hydration Serum"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Product Category / Industry
                    </label>
                    <input
                      type="text"
                      value={brief.category}
                      onChange={(e) => setBrief({ ...brief, category: e.target.value })}
                      placeholder="e.g. Creative Production, Beauty & Skincare, SaaS"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Target Customer Avatar *
                    </label>
                    <input
                      type="text"
                      value={brief.targetCustomer}
                      onChange={(e) => setBrief({ ...brief, targetCustomer: e.target.value })}
                      placeholder="e.g. Commercial Directors, Busy DTC Founders, Studio Heads"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Core Customer Problem / Frustration to Solve *
                  </label>
                  <textarea
                    rows={3}
                    value={brief.customerProblem}
                    onChange={(e) => setBrief({ ...brief, customerProblem: e.target.value })}
                    placeholder="e.g. Expensive rental equipment houses that take 5 days to confirm availability, or dull video ads with low retention."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end">
                <button
                  disabled={!brief.productOrService.trim() || !brief.targetCustomer.trim()}
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <span>Continue to Offer & Benefits</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: OFFER, PRICE & BENEFIT */}
          {currentStep === 2 && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div>
                <span className="text-xs uppercase tracking-wider text-sleek-violet font-semibold">Step 2 · Commercial Value</span>
                <h2 className="text-2xl font-bold text-white mt-1">What is the offer, price, and main benefit?</h2>
                <p className="text-sm text-white/50 mt-1">
                  We use verified offer parameters. No fake discounts or invented claims.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Offer or Pricing Details
                  </label>
                  <input
                    type="text"
                    value={brief.offerAndPrice}
                    onChange={(e) => setBrief({ ...brief, offerAndPrice: e.target.value })}
                    placeholder="e.g. Free 14-day production trial, or Starting at $499/day including Cooke prime lenses"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">
                    Main Key Benefit / Transformation *
                  </label>
                  <textarea
                    rows={3}
                    value={brief.mainBenefit}
                    onChange={(e) => setBrief({ ...brief, mainBenefit: e.target.value })}
                    placeholder="e.g. Produce Hollywood-grade video ads in 24 hours with zero upfront equipment capital."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={!brief.mainBenefit.trim()}
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 disabled:opacity-40 disabled:pointer-events-none text-white text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <span>Continue to Placement & CTA</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PLACEMENT & CALL TO ACTION */}
          {currentStep === 3 && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div>
                <span className="text-xs uppercase tracking-wider text-sleek-violet font-semibold">Step 3 · Distribution & Conversion</span>
                <h2 className="text-2xl font-bold text-white mt-1">Where will the ad run, and what action should viewers take?</h2>
                <p className="text-sm text-white/50 mt-1">
                  Visual composition and margin safety are automatically calculated for the chosen channel.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">
                    Primary Ad Placement
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    {[
                      { id: 'instagram_story', label: 'Instagram Story / Reel', ratio: '9:16 Vertical' },
                      { id: 'tiktok_9_16', label: 'TikTok Feed', ratio: '9:16 Vertical' },
                      { id: 'instagram_feed', label: 'Instagram Post', ratio: '1:1 Square' },
                      { id: 'facebook_feed', label: 'Facebook Post', ratio: '4:5 Portrait' },
                      { id: 'youtube_landscape', label: 'YouTube In-Stream', ratio: '16:9 Wide' },
                      { id: 'billboard_display', label: 'Digital Billboard', ratio: '1:1 High-Res' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setBrief({ ...brief, placement: p.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          brief.placement === p.id 
                            ? 'bg-sleek-violet/20 border-sleek-violet text-white shadow-sm' 
                            : 'bg-black/30 border-white/5 text-white/60 hover:border-white/20'
                        }`}
                      >
                        <span className="font-semibold block text-sm">{p.label}</span>
                        <span className="text-[10px] text-white/40 block mt-0.5">{p.ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/70 mb-2">
                    Primary Viewer Action (Call to Action)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'shop_now', label: 'Shop Now' },
                      { id: 'book_call', label: 'Book Consultation' },
                      { id: 'claim_offer', label: 'Claim Offer' },
                      { id: 'learn_more', label: 'Learn More' },
                      { id: 'install_app', label: 'Install App' },
                      { id: 'get_quote', label: 'Get Fast Quote' }
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setBrief({ ...brief, actionOrCta: c.id as any })}
                        className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                          brief.actionOrCta === c.id 
                            ? 'bg-sleek-violet text-white border-sleek-violet' 
                            : 'bg-black/30 border-white/5 text-white/60 hover:border-white/20'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-sm font-semibold transition-all flex items-center gap-2"
                >
                  <span>Continue to Visual Style & Assets</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: VISUAL STYLE, LANGUAGE & ASSETS */}
          {currentStep === 4 && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div>
                <span className="text-xs uppercase tracking-wider text-sleek-violet font-semibold">Step 4 · Brand Aesthetics & Assets</span>
                <h2 className="text-2xl font-bold text-white mt-1">Which language and visual style should we use?</h2>
                <p className="text-sm text-white/50 mt-1">
                  Upload your actual product photos, logos, and references.
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Visual Aesthetic Style
                    </label>
                    <select
                      value={brief.visualStyle}
                      onChange={(e) => setBrief({ ...brief, visualStyle: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                    >
                      <option value="cinematic_bold">Cinematic & Bold (Dramatic studio lighting)</option>
                      <option value="minimalist_clean">Minimalist & Clean (High-end Apple-like aesthetic)</option>
                      <option value="warm_lifestyle">Warm Lifestyle (Natural sunlit real-world settings)</option>
                      <option value="vibrant_pop">Vibrant Pop (High-contrast, energetic Gen-Z punch)</option>
                      <option value="luxury_editorial">Luxury Editorial (Dark reflective surfaces, muted gold)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">
                      Ad Language
                    </label>
                    <input
                      type="text"
                      value={brief.language}
                      onChange={(e) => setBrief({ ...brief, language: e.target.value })}
                      placeholder="e.g. English, Spanish, Hindi, French"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-sleek-violet focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                {/* File Uploads for Logos and Products */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-white/70">
                      Upload Logos, Product Photos & References
                    </label>
                    <span className="text-[11px] text-white/40">Optional but recommended</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {brief.uploadedAssets.map(asset => (
                      <div 
                        key={asset.id}
                        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-white/5 border border-white/10 text-xs"
                      >
                        <img src={asset.url} alt={asset.name} className="w-8 h-8 rounded object-cover" />
                        <span className="max-w-[120px] truncate">{asset.name}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveAsset(asset.id)}
                          className="text-white/40 hover:text-rose-400 text-xs ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 cursor-pointer transition-colors flex items-center gap-2">
                      <Upload size={14} />
                      <span>Upload Product Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleUploadAsset(e, 'product_photo')}
                        className="hidden" 
                      />
                    </label>

                    <label className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 cursor-pointer transition-colors flex items-center gap-2">
                      <Upload size={14} />
                      <span>Upload Logo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleUploadAsset(e, 'logo')}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Critical Safety Question: Preserve Product Photo? */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
                  <input
                    id="preserveProduct"
                    type="checkbox"
                    checked={brief.preserveProductPhotoUnchanged}
                    onChange={(e) => setBrief({ ...brief, preserveProductPhotoUnchanged: e.target.checked })}
                    className="mt-0.5 rounded border-white/20 text-sleek-violet focus:ring-0 w-4 h-4"
                  />
                  <label htmlFor="preserveProduct" className="text-xs text-white/80 leading-relaxed cursor-pointer">
                    <strong className="text-white block font-semibold mb-0.5">
                      Preserve original product photo identity
                    </strong>
                    When checked, the AI generates the visual frame and lighting to showcase your product without distorting or re-hallucinating the original packshot.
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSynthesizeDirections}
                  className="px-6 py-2.5 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-sleek-violet/20"
                >
                  <Sparkles size={16} />
                  <span>Synthesize 2 Creative Directions</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: PROPOSE TWO CREATIVE DIRECTIONS */}
          {currentStep === 5 && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div>
                <span className="text-xs uppercase tracking-wider text-sleek-violet font-semibold">Step 5 · Director Proposals</span>
                <h2 className="text-2xl font-bold text-white mt-1">Review Brief & Choose Your Creative Direction</h2>
                <p className="text-sm text-white/50 mt-1">
                  Our Creative Director synthesized two contrasting conversion strategies based on your answers.
                </p>
              </div>

              {/* Brief Confirmation Summary Badge */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-white/70">
                <div>
                  <span className="text-[10px] text-white/40 block">Product</span>
                  <span className="font-semibold text-white truncate block">{brief.productOrService}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">Customer</span>
                  <span className="font-semibold text-white truncate block">{brief.targetCustomer}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">Placement</span>
                  <span className="font-semibold text-white capitalize block">{brief.placement.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">Goal</span>
                  <span className="font-semibold text-sleek-violet capitalize block">{brief.actionOrCta.replace(/_/g, ' ')}</span>
                </div>
              </div>

              {isProposingDirections ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-sleek-violet mx-auto" />
                  <p className="text-sm font-medium text-white/80">
                    Creative Director is interviewing the audience psychology & formulating hooks...
                  </p>
                  <p className="text-xs text-white/40">Applying zero-fluff conversion rules</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposedDirections.map((dir, idx) => {
                    const isSelected = selectedDirection?.id === dir.id;
                    return (
                      <div
                        key={dir.id}
                        onClick={() => setSelectedDirection(dir)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-sleek-violet/15 border-sleek-violet ring-1 ring-sleek-violet text-white shadow-xl'
                            : 'bg-black/30 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 uppercase">
                              Direction {idx + 1}
                            </span>
                            {isSelected && (
                              <span className="text-[11px] font-semibold text-sleek-violet flex items-center gap-1">
                                <CheckCircle2 size={13} /> Selected
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-white">
                            {dir.directionTitle}
                          </h3>

                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-sleek-violet block">Hook Headline</span>
                            <p className="text-sm font-semibold text-white italic">"{dir.hookHeadline}"</p>
                          </div>

                          <div className="text-xs space-y-2">
                            <p><strong>Visual:</strong> {dir.visualConcept}</p>
                            <p><strong>Copy:</strong> {dir.supportingCopy}</p>
                            <p><strong>CTA:</strong> <span className="font-mono text-sleek-violet font-bold">{dir.callToAction}</span></p>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[11px] text-white/40 italic">
                            {dir.rationale}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateSelectedDirection(dir);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ml-2"
                          >
                            <Sparkles size={12} />
                            Generate Ad
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm transition-colors"
                >
                  Back to Brief
                </button>
                {selectedDirection && !isProposingDirections && (
                  <button
                    onClick={() => handleGenerateSelectedDirection(selectedDirection)}
                    className="px-6 py-2.5 rounded-xl bg-sleek-violet hover:bg-sleek-violet/90 text-white text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <span>Generate "{selectedDirection.directionTitle}"</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: GENERATING LOADING VIEW */}
          {currentStep === 6 && isGeneratingAd && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-12 text-center shadow-2xl space-y-4 animate-fade-in max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-sleek-violet/15 border border-sleek-violet/30 flex items-center justify-center text-sleek-violet mx-auto">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white">Rendering Studio Commercial Ad...</h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
                Synthesizing hero image with <strong>gemini-3.1-flash-lite-image</strong> in {brief.placement.replace(/_/g, ' ')} format with placement-safe margins.
              </p>
              <div className="text-[11px] text-white/40 font-mono">
                Preserving product integrity · Preparing typography layer
              </div>
            </div>
          )}

          {/* STEP 7: AD STUDIO PREVIEW, EDIT & DOWNLOAD */}
          {currentStep === 7 && generatedAd && (
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Production Ready
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {generatedAd.directionTitle} · Ad Preview & Editor
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTextOverlays(!showTextOverlays)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      showTextOverlays 
                        ? 'bg-sleek-violet/20 border-sleek-violet text-white' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    <Type size={13} />
                    <span>{showTextOverlays ? 'Text Overlays: ON' : 'Raw Art: ON'}</span>
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <Download size={14} />
                    <span>Download High-Res Ad</span>
                  </button>

                  {onConvertToProject && (
                    <button
                      onClick={handleSaveToProject}
                      className="px-4 py-2 rounded-lg bg-sleek-violet hover:bg-sleek-violet/90 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <FolderPlus size={14} />
                      <span>Convert to Project</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2-Column Studio: Left Preview Canvas, Right Edit Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Interactive Canvas */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/60 border border-white/10 rounded-2xl p-4 overflow-hidden relative min-h-[420px]">
                  <canvas 
                    ref={canvasRef} 
                    className="max-h-[520px] w-auto max-w-full rounded-xl shadow-2xl object-contain border border-white/5"
                  />
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-white/40">
                    <span>Format: {generatedAd.aspectRatio}</span>
                    <span>·</span>
                    <span>Safe Margins Active</span>
                    <span>·</span>
                    <span>No Hallucinated Claims</span>
                  </div>
                </div>

                {/* Right: Live Editorial & Adaptation Controls */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Live Text Editing */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders size={13} className="text-sleek-violet" />
                      Live Ad Typography Overlays
                    </h4>

                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Headline Hook</label>
                      <input
                        type="text"
                        value={editableHeadline}
                        onChange={(e) => setEditableHeadline(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-sleek-violet focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Offer / Guarantee Sub-Text</label>
                      <input
                        type="text"
                        value={editableOffer}
                        onChange={(e) => setEditableOffer(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-sleek-violet focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-white/60 mb-1">Call to Action Button</label>
                      <input
                        type="text"
                        value={editableCta}
                        onChange={(e) => setEditableCta(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-sleek-violet focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Variation & Adapt Placement */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-sleek-violet" />
                      Adapt to Other Placements & Styles
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-white/50 mb-1">Placement</label>
                        <select
                          value={selectedPlacementAdapt}
                          onChange={(e) => setSelectedPlacementAdapt(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
                        >
                          <option value="instagram_story">Instagram Story (9:16)</option>
                          <option value="instagram_feed">Instagram Feed (1:1)</option>
                          <option value="facebook_feed">Facebook Post (4:5)</option>
                          <option value="youtube_landscape">YouTube Wide (16:9)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-white/50 mb-1">Visual Mood</label>
                        <select
                          value={styleOverride}
                          onChange={(e) => setStyleOverride(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none"
                        >
                          <option value="cinematic_bold">Cinematic Studio</option>
                          <option value="minimalist_clean">Minimalist Clean</option>
                          <option value="warm_lifestyle">Warm Lifestyle</option>
                          <option value="luxury_editorial">Luxury Dark</option>
                        </select>
                      </div>
                    </div>

                    <button
                      disabled={isAdapting}
                      onClick={handleAdaptPlacement}
                      className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isAdapting ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-sleek-violet" />
                          <span>Generating Variation with Provider...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={13} />
                          <span>Generate Placement Variation</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions & Back */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft size={13} /> Try Alternate Direction
                    </button>
                    {onNavigateToStudio && (
                      <button
                        onClick={() => onNavigateToStudio('campaign', `${generatedAd.directionTitle}: ${editableHeadline}`)}
                        className="text-xs text-sleek-violet hover:text-sleek-fuchsia transition-colors flex items-center gap-1"
                      >
                        Launch in Veo Video Studio <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
