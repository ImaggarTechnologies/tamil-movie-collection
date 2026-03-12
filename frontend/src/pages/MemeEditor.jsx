import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
    Download, Trash2, Image as ImageIcon,
    Smile, Undo2, Redo2, MousePointer2,
    Type as TypeIcon, ChevronDown,
    ZoomIn, ZoomOut, HelpCircle,
    Sliders, X, Crop, LayoutTemplate
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';

const FONTS = [
    'Impact, Arial Black, sans-serif',
    'Arial, sans-serif',
    'Comic Sans MS, cursive',
    'Courier New, monospace',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Bebas Neue, sans-serif',
    'Anton, sans-serif'
];

const EMOJIS = [
    '😂', '🔥', '💀', '😱', '🤩', '🤔', '💯', '❤️',
    '😎', '🙄', '🎉', '✨', '💩', '🤡', '👽', '👾',
    '👀', '👅', '🧠', '💪', '🤙', '🤝', '🙌', '🙏',
    '🚀', '🛸', '🌈', '☀️', '🌕', '🍀', '🍕', '🍻'
];

// ── Aspect Ratio Presets ──────────────────────────────────────
const ASPECT_RATIOS = [
    { label: 'Free',  value: 'free',  width: 800, height: 600 },
    { label: '1:1',   value: '1:1',   width: 800, height: 800 },
    { label: '16:9',  value: '16:9',  width: 800, height: 450 },
    { label: '9:16',  value: '9:16',  width: 450, height: 800 },
    { label: '4:3',   value: '4:3',   width: 800, height: 600 },
    { label: '3:2',   value: '3:2',   width: 800, height: 533 },
    { label: '21:9',  value: '21:9',  width: 800, height: 343 },
];

// ── Collage Layout Definitions ────────────────────────────────
// Each zone: { x, y, w, h } as fractions of canvas (0–1)
const COLLAGE_LAYOUTS = [
    {
        id: 'side-by-side',
        label: 'Side by Side',
        slots: 2,
        zones: [
            { x: 0,   y: 0, w: 0.5, h: 1 },
            { x: 0.5, y: 0, w: 0.5, h: 1 },
        ],
    },
    {
        id: 'top-bottom',
        label: 'Top & Bottom',
        slots: 2,
        zones: [
            { x: 0, y: 0,   w: 1, h: 0.5 },
            { x: 0, y: 0.5, w: 1, h: 0.5 },
        ],
    },
    {
        id: 'big-left',
        label: 'Big Left',
        slots: 3,
        zones: [
            { x: 0,   y: 0,   w: 0.5, h: 1   },
            { x: 0.5, y: 0,   w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        id: 'big-top',
        label: 'Big Top',
        slots: 3,
        zones: [
            { x: 0,   y: 0,   w: 1,   h: 0.5 },
            { x: 0,   y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
    {
        id: 'grid-2x2',
        label: '2×2 Grid',
        slots: 4,
        zones: [
            { x: 0,   y: 0,   w: 0.5, h: 0.5 },
            { x: 0.5, y: 0,   w: 0.5, h: 0.5 },
            { x: 0,   y: 0.5, w: 0.5, h: 0.5 },
            { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
        ],
    },
];

// ── Collage Layout SVG Preview ────────────────────────────────
const CollagePreview = ({ layout, active }) => {
    const W = 36, H = 28;
    return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {layout.zones.map((z, i) => (
                <rect
                    key={i}
                    x={z.x * W + 1}
                    y={z.y * H + 1}
                    width={z.w * W - 2}
                    height={z.h * H - 2}
                    rx="2"
                    fill={active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}
                    stroke={active ? '#818cf8' : 'rgba(255,255,255,0.2)'}
                    strokeWidth="1.5"
                />
            ))}
        </svg>
    );
};

// ─────────────────────────────────────────────────────────────
const MemeEditor = () => {
    const canvasRef       = useRef(null);
    const fabricCanvasRef = useRef(null);
    const workspaceRef    = useRef(null);

    const [selectedObject, setSelectedObject] = useState(null);
    const [textColor,      setTextColor]      = useState('#ffffff');
    const [activeFont,     setActiveFont]     = useState(FONTS[0]);
    const [zoom,           setZoom]           = useState(1);
    const [activeTool,     setActiveTool]     = useState('select');
    const [projectName,    setProjectName]    = useState('Untitled_Project_01');
    const [canvasSize,     setCanvasSize]     = useState({ width: 800, height: 600 });
    const [activeRatio,    setActiveRatio]    = useState('free');
    const [activeCollage,  setActiveCollage]  = useState(null);

    const { isDarkMode } = useTheme();

    // ── History ───────────────────────────────────────────────
    const historyStack    = useRef([]);
    const redoStack       = useRef([]);
    const isHistoryChange = useRef(false);

    const saveHistory = useCallback(() => {
        if (isHistoryChange.current || !fabricCanvasRef.current) return;
        const json = JSON.stringify(fabricCanvasRef.current.toJSON());
        if (
            historyStack.current.length > 0 &&
            historyStack.current[historyStack.current.length - 1] === json
        ) return;
        historyStack.current.push(json);
        if (historyStack.current.length > 50) historyStack.current.shift();
        redoStack.current = [];
    }, []);

    const undo = useCallback(async () => {
        if (historyStack.current.length <= 1) return;
        isHistoryChange.current = true;
        const current = historyStack.current.pop();
        redoStack.current.push(current);
        await fabricCanvasRef.current.loadFromJSON(
            historyStack.current[historyStack.current.length - 1]
        );
        fabricCanvasRef.current.renderAll();
        isHistoryChange.current = false;
    }, []);

    const redo = useCallback(async () => {
        if (redoStack.current.length === 0) return;
        isHistoryChange.current = true;
        const next = redoStack.current.pop();
        historyStack.current.push(next);
        await fabricCanvasRef.current.loadFromJSON(next);
        fabricCanvasRef.current.renderAll();
        isHistoryChange.current = false;
    }, []);

    const deleteSelected = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const activeObjects = fabricCanvasRef.current.getActiveObjects();
        if (activeObjects.length > 0) {
            fabricCanvasRef.current.remove(...activeObjects);
            fabricCanvasRef.current.discardActiveObject();
            fabricCanvasRef.current.renderAll();
        }
    }, []);

    // ── Canvas Init ───────────────────────────────────────────
    useEffect(() => {
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: 'rgba(0,0,0,0)',
            preserveObjectStacking: true,
        });
        fabricCanvasRef.current = canvas;

        canvas.on('selection:created',  (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:updated',  (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:cleared',  ()  => setSelectedObject(null));
        canvas.on('object:added',   saveHistory);
        canvas.on('object:modified', saveHistory);
        canvas.on('object:removed', saveHistory);
        saveHistory();

        const handleKeyDown = (e) => {
            const active = canvas.getActiveObject();
            if (active && active.isEditing) return;
            if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault(); undo();
            }
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
            ) {
                e.preventDefault(); redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => { canvas.dispose(); window.removeEventListener('keydown', handleKeyDown); };
    }, [saveHistory, undo, redo, deleteSelected]);

    // ── Aspect Ratio — rescales all objects proportionally ────
    const applyAspectRatio = (ratio) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const scaleX = ratio.width  / canvas.width;
        const scaleY = ratio.height / canvas.height;

        // Rescale every object proportionally to the new canvas size
        canvas.getObjects().forEach((obj) => {
            obj.set({
                left:   obj.left   * scaleX,
                top:    obj.top    * scaleY,
                scaleX: obj.scaleX * scaleX,
                scaleY: obj.scaleY * scaleY,
            });
            obj.setCoords();
        });

        canvas.setWidth(ratio.width);
        canvas.setHeight(ratio.height);
        canvas.renderAll();

        setActiveRatio(ratio.value);
        setCanvasSize({ width: ratio.width, height: ratio.height });
        setActiveTool('select');
        saveHistory();
    };

    // ── Regular image upload ──────────────────────────────────
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (f) => {
            const img   = await fabric.FabricImage.fromURL(f.target.result);
            const scale = Math.min(
                (fabricCanvasRef.current.width  * 0.8) / img.width,
                (fabricCanvasRef.current.height * 0.8) / img.height
            );
            img.set({
                scaleX: scale,
                scaleY: scale,
                left: (fabricCanvasRef.current.width  - img.width  * scale) / 2,
                top:  (fabricCanvasRef.current.height - img.height * scale) / 2,
                padding: 0,
            });
            fabricCanvasRef.current.add(img);
            fabricCanvasRef.current.setActiveObject(img);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // ── Collage: draw placeholder zones ──────────────────────
    const applyCollageLayout = (layout) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        setActiveCollage(layout);
        canvas.clear();

        const W = canvas.width;
        const H = canvas.height;

        layout.zones.forEach((z, i) => {
            // Outer border rect
            const rect = new fabric.Rect({
                left:            z.x * W,
                top:             z.y * H,
                width:           z.w * W,
                height:          z.h * H,
                fill:            '#1a1a2e',          // always visible dark fill
                stroke:          '#6366f1',
                strokeWidth:     2,
                strokeDashArray: [8, 5],
                selectable:      false,
                evented:         false,
                name:            `collage-zone-${i}`,
            });

            // + label centered in the zone
            const labelObj = new fabric.Textbox(`+ Photo ${i + 1}`, {
                left:       z.x * W,
                top:        z.y * H + (z.h * H) / 2 - 10,
                width:      z.w * W,
                fontSize:   14,
                fill:       '#818cf8',
                textAlign:  'center',
                selectable: false,
                evented:    false,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                name:       `collage-label-${i}`,
            });

            canvas.add(rect);
            canvas.add(labelObj);
        });

        canvas.renderAll();
        setActiveTool('select');
    };

    // ── Collage: upload image into a slot ────────────────────
    const handleCollageImageUpload = async (e, slotIndex) => {
        const file = e.target.files[0];
        if (!file || !activeCollage) return;

        const canvas = fabricCanvasRef.current;
        const W      = canvas.width;
        const H      = canvas.height;
        const zone   = activeCollage.zones[slotIndex];

        const reader = new FileReader();
        reader.onload = async (f) => {
            const img   = await fabric.FabricImage.fromURL(f.target.result);
            const zoneW = zone.w * W;
            const zoneH = zone.h * H;
            const zoneX = zone.x * W;
            const zoneY = zone.y * H;

            // Cover scale: fill the zone completely
            const scale   = Math.max(zoneW / img.width, zoneH / img.height);
            const imgW    = img.width  * scale;
            const imgH    = img.height * scale;

            // Center image within zone
            const left = zoneX + (zoneW - imgW) / 2;
            const top  = zoneY + (zoneH - imgH) / 2;

            // clipPath uses absolutePositioned=true so it's in canvas coordinates
            const clip = new fabric.Rect({
                left:               zoneX,
                top:                zoneY,
                width:              zoneW,
                height:             zoneH,
                absolutePositioned: true,   // ← key fix: clip in canvas space
            });

            img.set({
                left,
                top,
                scaleX: scale,
                scaleY: scale,
                clipPath: clip,
                name: `collage-img-${slotIndex}`,
                selectable: true,
            });

            // Remove placeholder + any previous image for this slot
            canvas.getObjects()
                .filter(o =>
                    o.name === `collage-zone-${slotIndex}`  ||
                    o.name === `collage-label-${slotIndex}` ||
                    o.name === `collage-img-${slotIndex}`
                )
                .forEach(o => canvas.remove(o));

            canvas.add(img);
            canvas.renderAll();
            saveHistory();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // ── Text / Emoji ──────────────────────────────────────────
    const addText = () => {
        const text = new fabric.Textbox('NEW TEXT', {
            left: 250, top: 250, width: 300,
            fontSize: 36, charSpacing: 50,
            fill: textColor, fontFamily: activeFont,
            textAlign: 'center', stroke: '', strokeWidth: 0,
            fontWeight: 'normal', cornerStyle: 'circle',
            cornerColor: '#6366f1', transparentCorners: false, padding: 0,
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const addEmoji = (emoji) => {
        const text = new fabric.Textbox(emoji, {
            left: 350, top: 250, width: 100, fontSize: 100, padding: 0,
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    // ── Color / Font ──────────────────────────────────────────
    const changeColor = (color) => {
        setTextColor(color);
        const active = fabricCanvasRef.current.getActiveObject();
        if (active?.set) {
            active.set('fill', color);
            fabricCanvasRef.current.renderAll();
            saveHistory();
        }
    };

    const changeFont = (font) => {
        setActiveFont(font);
        const active = fabricCanvasRef.current.getActiveObject();
        if (active?.set) {
            active.set('fontFamily', font);
            fabricCanvasRef.current.renderAll();
            saveHistory();
        }
    };

    // ── Download ──────────────────────────────────────────────
    const downloadMeme = () => {
        const dataURL = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1 });
        const link    = document.createElement('a');
        link.download = `${
            projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'meme-export'
        }.png`;
        link.href = dataURL;
        link.click();
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <div className={cn(
            "max-w-[1440px] w-[calc(100%-32px)] mx-auto flex h-[calc(100vh-64px-32px-32px)] mt-8 mb-8 overflow-hidden font-sans selection:bg-indigo-500/30 rounded-xl border transition-all",
            isDarkMode ? "bg-[#0a0a0c] text-slate-300 border-white/5" : "bg-white text-slate-900 border-slate-200"
        )}>

            {/* ── LEFT TOOLBAR ─────────────────────────────────── */}
            <div className={cn(
                "w-[48px] flex flex-col items-center py-4 space-y-3 shrink-0",
                isDarkMode ? "bg-[#141416] border-r border-white/5" : "bg-white/90 border-r border-slate-200"
            )}>
                <ToolButton
                    active={activeTool === 'select'}
                    onClick={() => setActiveTool('select')}
                    icon={<MousePointer2 className="w-5 h-5" />}
                    label="Select"
                />
                <div className="w-8 h-px bg-white/5 my-1" />
                <ToolButton
                    active={activeTool === 'text'}
                    onClick={() => { setActiveTool('text'); addText(); }}
                    icon={<TypeIcon className="w-5 h-5" />}
                    label="Text"
                />
                <label className="cursor-pointer group relative">
                    <ToolButton
                        active={activeTool === 'image'}
                        onClick={() => {}}
                        icon={<ImageIcon className="w-5 h-5" />}
                        label="Media"
                        asDiv
                    />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
                <ToolButton
                    active={activeTool === 'emoji'}
                    onClick={() => setActiveTool('emoji')}
                    icon={<Smile className="w-5 h-5" />}
                    label="Emoji"
                />

                <div className="w-8 h-px bg-white/5 my-1" />

                {/* Aspect Ratio */}
                <ToolButton
                    active={activeTool === 'aspectratio'}
                    onClick={() => setActiveTool(activeTool === 'aspectratio' ? 'select' : 'aspectratio')}
                    icon={<Crop className="w-5 h-5" />}
                    label="Aspect Ratio"
                />
                {/* Collage */}
                <ToolButton
                    active={activeTool === 'collage'}
                    onClick={() => setActiveTool(activeTool === 'collage' ? 'select' : 'collage')}
                    icon={<LayoutTemplate className="w-5 h-5" />}
                    label="Collage"
                />

                <div className="flex-grow" />
                <ToolButton onClick={undo} icon={<Undo2 className="w-5 h-5" />}     label="Undo" />
                <ToolButton onClick={redo} icon={<Redo2 className="w-5 h-5" />}     label="Redo" />
                <ToolButton               icon={<HelpCircle className="w-5 h-5" />} label="Help" />
            </div>

            {/* ── MAIN WORKSPACE ───────────────────────────────── */}
            <div className={cn(
                "flex-grow flex flex-col min-w-0",
                isDarkMode ? "bg-[#0a0a0c]" : "bg-transparent"
            )}>
                {/* Header bar */}
                <div className={cn(
                    "h-12 border-b flex items-center justify-between px-6 backdrop-blur-md",
                    isDarkMode ? "border-white/5 bg-[#141416]/50" : "border-slate-200 bg-white/80"
                )}>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">
                            Open Memes Editor
                        </span>
                        <div className={cn("h-4 w-px", isDarkMode ? "bg-white/10" : "bg-slate-200")} />
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className={cn(
                                "bg-transparent border-none text-[11px] font-mono uppercase focus:outline-none w-48 px-2 py-0.5 rounded",
                                isDarkMode
                                    ? "text-slate-400 focus:text-white hover:bg-white/5"
                                    : "text-slate-500 focus:text-indigo-600 hover:bg-slate-100"
                            )}
                            placeholder="PROJECT_NAME"
                        />
                    </div>
                    <button
                        onClick={downloadMeme}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Download className="w-3.5 h-3.5" /> EXPORT
                    </button>
                </div>

                {/* Canvas area */}
                <div
                    ref={workspaceRef}
                    className={cn(
                        "flex-grow relative overflow-auto custom-scrollbar flex items-center justify-center p-8",
                        isDarkMode ? "bg-[#0a0a0c]" : "bg-white"
                    )}
                >
                    {/* Dot-grid background */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            backgroundImage: isDarkMode
                                ? `linear-gradient(#1e1e22 1px, transparent 1px), linear-gradient(90deg, #1e1e22 1px, transparent 1px)`
                                : `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }}
                    />

                    <div className="relative">
                        {/* Canvas border wrapper — position:relative so overlays align to canvas pixels */}
                        <div
                            className={cn(
                                "relative border transition-all",
                                isDarkMode
                                    ? "border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                                    : "border-slate-200 shadow-xl"
                            )}
                        >
                            <canvas ref={canvasRef} />

                            {/* Collage hover-upload overlays — children of border div so top:0/left:0 = canvas corner */}
                            {activeCollage && activeCollage.zones.map((zone, i) => (
                                <label
                                    key={i}
                                    className="absolute cursor-pointer group/slot z-10"
                                    style={{
                                        left:   `${zone.x * canvasSize.width}px`,
                                        top:    `${zone.y * canvasSize.height}px`,
                                        width:  `${zone.w * canvasSize.width}px`,
                                        height: `${zone.h * canvasSize.height}px`,
                                    }}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleCollageImageUpload(e, i)}
                                    />
                                    <div className="w-full h-full opacity-0 group-hover/slot:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 bg-indigo-600/20 border-2 border-indigo-400 border-dashed">
                                        <span className="text-2xl">📷</span>
                                        <span className="text-indigo-300 text-[11px] font-bold uppercase tracking-widest">
                                            Click to Upload
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status bar */}
                <div className={cn(
                    "h-8 border-t flex items-center justify-between px-4 text-[10px] uppercase tracking-widest font-bold",
                    isDarkMode ? "border-white/5 bg-[#141416] text-slate-500" : "border-slate-200 bg-white text-slate-600"
                )}>
                    <div className="flex items-center gap-3">
                        <span className="text-indigo-400">
                            {ASPECT_RATIOS.find(r => r.value === activeRatio)?.label || 'Free'}
                        </span>
                        {activeCollage && (
                            <>
                                <span className="opacity-30">|</span>
                                <span className="text-purple-400">Collage: {activeCollage.label}</span>
                                <button
                                    onClick={() => { setActiveCollage(null); fabricCanvasRef.current?.clear(); }}
                                    className="text-red-400 hover:text-red-300 transition-colors text-[9px]"
                                >
                                    ✕ Clear
                                </button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex items-center gap-2 px-2 py-0.5 rounded",
                            isDarkMode ? "bg-[#1e1e22]" : "bg-slate-100"
                        )}>
                            <ZoomOut className="w-3 h-3 cursor-pointer" />
                            <span className="font-mono">{Math.round(zoom * 100)}%</span>
                            <ZoomIn className="w-3 h-3 cursor-pointer" />
                        </div>
                        <span className="font-mono">{canvasSize.width}×{canvasSize.height}</span>
                    </div>
                </div>
            </div>

            {/* ── RIGHT INSPECTOR ──────────────────────────────── */}
            <div className={cn(
                "w-[220px] flex flex-col shrink-0",
                isDarkMode ? "bg-[#141416] border-l border-white/5" : "bg-white/90 border-l border-slate-200"
            )}>
                <div className={cn(
                    "h-12 border-b flex items-center px-4 gap-2",
                    isDarkMode ? "border-white/5" : "border-slate-200"
                )}>
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Properties</span>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {selectedObject ? (
                        <div className="p-4 space-y-6">
                            {/* Color */}
                            <PropertySection label="Appearance">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Fill Color</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-400">{textColor}</span>
                                            <div className="w-6 h-6 rounded border border-white/10 overflow-hidden relative">
                                                <input
                                                    type="color"
                                                    value={textColor}
                                                    onChange={(e) => changeColor(e.target.value)}
                                                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                                />
                                                <div className="w-full h-full pointer-events-none" style={{ background: textColor }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {['#ffffff', '#000000', '#ef4444', '#10b981', '#3b82f6', '#f59e0b'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => changeColor(c)}
                                                className="w-full aspect-square rounded border border-white/5"
                                                style={{ background: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </PropertySection>

                            {/* Typography */}
                            {(selectedObject.type === 'textbox' || selectedObject.type === 'i-text') && (
                                <PropertySection label="Typography">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <select
                                                value={activeFont}
                                                onChange={(e) => changeFont(e.target.value)}
                                                className={cn(
                                                    "w-full border text-[11px] rounded px-3 py-2 outline-none appearance-none font-bold",
                                                    isDarkMode
                                                        ? "bg-[#1e1e22] border-white/5 text-slate-300"
                                                        : "bg-white border-slate-200 text-slate-700"
                                                )}
                                            >
                                                {FONTS.map(f => (
                                                    <option key={f} value={f}>{f.split(',')[0]}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-slate-500 pointer-events-none" />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['B', 'I', 'U', 'S'].map(s => (
                                                <button
                                                    key={s}
                                                    className={cn(
                                                        "p-2 rounded text-xs border transition-colors",
                                                        isDarkMode
                                                            ? "bg-[#1e1e22] border-white/5 hover:bg-[#252529]"
                                                            : "bg-white border-slate-200 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </PropertySection>
                            )}

                            {/* Selection tools */}
                            <PropertySection label="Selection Tools">
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={deleteSelected}
                                        className="flex items-center justify-center gap-2 p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 text-[10px] font-bold tracking-widest transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> DELETE OBJECT
                                    </button>
                                    <button
                                        onClick={() => {
                                            fabricCanvasRef.current.centerObject(selectedObject);
                                            fabricCanvasRef.current.renderAll();
                                        }}
                                        className={cn(
                                            "p-2.5 rounded border text-[10px] font-bold tracking-widest transition-all",
                                            isDarkMode
                                                ? "bg-[#1e1e22] border-white/5 text-slate-400 hover:bg-[#252529]"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        ALIGN CENTER
                                    </button>
                                </div>
                            </PropertySection>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center px-8 opacity-30">
                            <MousePointer2 className="w-10 h-10 mb-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">No Selection</span>
                            <p className="text-[10px] mt-2">Select an element on canvas to edit properties</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── FLOATING: EMOJI DRAWER ───────────────────────── */}
            {activeTool === 'emoji' && (
                <div className={cn(
                    "absolute left-[70px] top-4 bottom-4 w-64 rounded-lg shadow-2xl z-50 flex flex-col animate-in slide-in-from-left-4 duration-200",
                    isDarkMode ? "bg-[#141416] border border-white/10" : "bg-white/95 border border-slate-200"
                )}>
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
                            Emoji Assets
                        </span>
                        <button onClick={() => setActiveTool('select')}>
                            <X className="w-4 h-4 text-slate-500 hover:text-white" />
                        </button>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto custom-scrollbar">
                        {EMOJIS.map(e => (
                            <button
                                key={e}
                                onClick={() => addEmoji(e)}
                                className="text-3xl hover:scale-125 transition-transform"
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── FLOATING: ASPECT RATIO DRAWER ───────────────── */}
            {activeTool === 'aspectratio' && (
                <div className={cn(
                    "absolute left-[70px] top-4 w-64 rounded-lg shadow-2xl z-50 flex flex-col animate-in slide-in-from-left-4 duration-200",
                    isDarkMode ? "bg-[#141416] border border-white/10" : "bg-white/95 border border-slate-200"
                )}>
                    <div className={cn(
                        "p-4 border-b flex items-center justify-between",
                        isDarkMode ? "border-white/5" : "border-slate-200"
                    )}>
                        <div className="flex items-center gap-2">
                            <Crop className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
                                Aspect Ratio
                            </span>
                        </div>
                        <button onClick={() => setActiveTool('select')}>
                            <X className="w-4 h-4 text-slate-500 hover:text-white" />
                        </button>
                    </div>

                    <div className="p-3 space-y-1">
                        {ASPECT_RATIOS.map((ratio) => (
                            <button
                                key={ratio.value}
                                onClick={() => applyAspectRatio(ratio)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all",
                                    activeRatio === ratio.value
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                        : isDarkMode
                                            ? "text-slate-400 hover:bg-white/5 hover:text-white"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-6">
                                        <div
                                            className={cn(
                                                "border-2 rounded-sm",
                                                activeRatio === ratio.value ? "border-white" : "border-current opacity-60"
                                            )}
                                            style={{
                                                width:  `${Math.round(28 * (ratio.width  / Math.max(ratio.width, ratio.height)))}px`,
                                                height: `${Math.round(20 * (ratio.height / Math.max(ratio.width, ratio.height)))}px`,
                                            }}
                                        />
                                    </div>
                                    <span className="uppercase tracking-widest">{ratio.label}</span>
                                </div>
                                <span className={cn(
                                    "text-[9px] font-mono",
                                    activeRatio === ratio.value ? "text-white/70" : "opacity-40"
                                )}>
                                    {ratio.width}×{ratio.height}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className={cn(
                        "p-3 border-t mx-3 mb-3 rounded-lg text-center text-[10px] font-mono",
                        isDarkMode ? "border-white/5 bg-white/5 text-slate-500" : "border-slate-100 bg-slate-50 text-slate-400"
                    )}>
                        CANVAS: {canvasSize.width} × {canvasSize.height}px
                    </div>
                </div>
            )}

            {/* ── FLOATING: COLLAGE DRAWER ─────────────────────── */}
            {activeTool === 'collage' && (
                <div className={cn(
                    "absolute left-[70px] top-4 w-72 rounded-lg shadow-2xl z-50 flex flex-col animate-in slide-in-from-left-4 duration-200",
                    isDarkMode ? "bg-[#141416] border border-white/10" : "bg-white/95 border border-slate-200"
                )}>
                    <div className={cn(
                        "p-4 border-b flex items-center justify-between",
                        isDarkMode ? "border-white/5" : "border-slate-200"
                    )}>
                        <div className="flex items-center gap-2">
                            <LayoutTemplate className="w-4 h-4 text-purple-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                                Collage Layout
                            </span>
                        </div>
                        <button onClick={() => setActiveTool('select')}>
                            <X className="w-4 h-4 text-slate-500 hover:text-white" />
                        </button>
                    </div>

                    <div className="p-3 space-y-2">
                        {COLLAGE_LAYOUTS.map((layout) => (
                            <button
                                key={layout.id}
                                onClick={() => applyCollageLayout(layout)}
                                className={cn(
                                    "w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all",
                                    activeCollage?.id === layout.id
                                        ? "bg-purple-600/20 border border-purple-500/50"
                                        : isDarkMode
                                            ? "hover:bg-white/5 border border-transparent"
                                            : "hover:bg-slate-100 border border-transparent"
                                )}
                            >
                                <CollagePreview layout={layout} active={activeCollage?.id === layout.id} />
                                <div className="text-left">
                                    <div className={cn(
                                        "text-[11px] font-bold uppercase tracking-widest",
                                        activeCollage?.id === layout.id
                                            ? "text-purple-300"
                                            : isDarkMode ? "text-slate-300" : "text-slate-700"
                                    )}>
                                        {layout.label}
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">
                                        {layout.slots} {layout.slots === 1 ? 'photo' : 'photos'}
                                    </div>
                                </div>
                                {activeCollage?.id === layout.id && (
                                    <div className="ml-auto w-2 h-2 rounded-full bg-purple-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Hint */}
                    <div className={cn(
                        "p-3 mx-3 rounded-lg text-[10px] leading-relaxed",
                        isDarkMode ? "bg-white/5 text-slate-500" : "bg-slate-50 text-slate-400"
                    )}>
                        {activeCollage
                            ? `✅ ${activeCollage.label} applied! Hover each zone on the canvas and click to upload.`
                            : '👆 Pick a layout to split the canvas into photo zones.'}
                    </div>

                    {/* Clear */}
                    {activeCollage && (
                        <button
                            onClick={() => {
                                setActiveCollage(null);
                                fabricCanvasRef.current?.clear();
                                setActiveTool('select');
                            }}
                            className="mx-3 my-3 p-2 rounded border border-red-500/20 text-red-400 text-[10px] font-bold tracking-widest hover:bg-red-500/10 transition-all"
                        >
                            ✕ CLEAR COLLAGE
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Reusable sub-components ───────────────────────────────────
const ToolButton = ({ active, onClick, icon, label, asDiv }) => {
    const { isDarkMode } = useTheme();
    const Component = asDiv ? 'div' : 'button';
    return (
        <Component
            onClick={onClick}
            title={label}
            className={cn(
                "p-3 rounded transition-all duration-200 group relative",
                active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : isDarkMode
                        ? "text-slate-500 hover:bg-white/5 hover:text-white"
                        : "text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
            )}
        >
            {icon}
            {!active && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-black text-[10px] font-bold uppercase tracking-widest text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] border border-white/10">
                    {label}
                </div>
            )}
        </Component>
    );
};

const PropertySection = ({ label, children }) => {
    const { isDarkMode } = useTheme();
    return (
        <div className="space-y-4">
            <label className={cn(
                "text-[10px] font-bold uppercase tracking-widest block",
                isDarkMode ? "text-slate-500" : "text-slate-400"
            )}>
                {label}
            </label>
            {children}
        </div>
    );
};

export default MemeEditor;