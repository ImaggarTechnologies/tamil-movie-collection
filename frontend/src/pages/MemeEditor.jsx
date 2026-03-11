import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
    Upload, Type, Download, Trash2, RotateCcw, Image as ImageIcon,
    Smile, Palette, Undo2, Redo2, Maximize2, Layers, MousePointer2,
    Type as TypeIcon, Hash, ChevronDown, Save,
    Share2, ZoomIn, ZoomOut, Expand, HelpCircle, Settings2,
    History, Layout, Sliders, Menu, X
} from 'lucide-react';
import { cn } from '../lib/utils';

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

const MemeEditor = () => {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const workspaceRef = useRef(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [textColor, setTextColor] = useState('#ffffff');
    const [activeFont, setActiveFont] = useState(FONTS[0]);
    const [zoom, setZoom] = useState(1);
    const [activeTool, setActiveTool] = useState('select'); // 'select', 'text', 'image', 'emoji'
    const [projectName, setProjectName] = useState('Untitled_Project_01');

    // History management
    const historyStack = useRef([]);
    const redoStack = useRef([]);
    const isHistoryChange = useRef(false);

    const saveHistory = useCallback(() => {
        if (isHistoryChange.current || !fabricCanvasRef.current) return;

        const json = JSON.stringify(fabricCanvasRef.current.toJSON());
        if (historyStack.current.length > 0 && historyStack.current[historyStack.current.length - 1] === json) return;

        historyStack.current.push(json);
        if (historyStack.current.length > 50) historyStack.current.shift();
        redoStack.current = [];
    }, []);

    const undo = useCallback(async () => {
        if (historyStack.current.length <= 1) return;

        isHistoryChange.current = true;
        const current = historyStack.current.pop();
        redoStack.current.push(current);

        const previous = historyStack.current[historyStack.current.length - 1];
        await fabricCanvasRef.current.loadFromJSON(previous);
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

    useEffect(() => {
        const workspace = workspaceRef.current;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#0f172a',
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        canvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
        canvas.on('selection:cleared', () => setSelectedObject(null));

        canvas.on('object:added', saveHistory);
        canvas.on('object:modified', saveHistory);
        canvas.on('object:removed', saveHistory);

        saveHistory();

        const handleKeyDown = (e) => {
            const active = canvas.getActiveObject();
            if (active && active.isEditing) return;

            if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            canvas.dispose();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [saveHistory, undo, redo, deleteSelected]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (f) => {
            const data = f.target.result;
            const img = await fabric.FabricImage.fromURL(data);

            const scale = Math.min(
                (fabricCanvasRef.current.width * 0.8) / img.width,
                (fabricCanvasRef.current.height * 0.8) / img.height
            );

            img.set({
                scaleX: scale,
                scaleY: scale,
                left: (fabricCanvasRef.current.width - img.width * scale) / 2,
                top: (fabricCanvasRef.current.height - img.height * scale) / 2,
                padding: 0,
            });

            fabricCanvasRef.current.add(img);
            fabricCanvasRef.current.setActiveObject(img);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const addText = () => {
        const text = new fabric.Textbox('NEW TEXT', {
            left: 250,
            top: 250,
            width: 300,
            fontSize: 48,
            fill: textColor,
            fontFamily: activeFont,
            textAlign: 'center',
            stroke: '#000000',
            strokeWidth: 2,
            fontWeight: 'bold',
            cornerStyle: 'circle',
            cornerColor: '#6366f1',
            transparentCorners: false,
            padding: 0,
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const addEmoji = (emoji) => {
        const text = new fabric.Textbox(emoji, {
            left: 350,
            top: 250,
            width: 100,
            fontSize: 100,
            padding: 0,
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const changeColor = (color) => {
        setTextColor(color);
        const active = fabricCanvasRef.current.getActiveObject();
        if (active && active.set) {
            active.set('fill', color);
            fabricCanvasRef.current.renderAll();
            saveHistory();
        }
    };

    const changeFont = (font) => {
        setActiveFont(font);
        const active = fabricCanvasRef.current.getActiveObject();
        if (active && active.set) {
            active.set('fontFamily', font);
            fabricCanvasRef.current.renderAll();
            saveHistory();
        }
    };

    const downloadMeme = () => {
        const dataURL = fabricCanvasRef.current.toDataURL({ format: 'png', quality: 1 });
        const link = document.createElement('a');
        const fileName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'meme-export';
        link.download = `${fileName}.png`;
        link.href = dataURL;
        link.click();
    };

    return (
        <div className="max-w-[1440px] w-[calc(100%-32px)] mx-auto flex h-[calc(100vh-64px-16px)] mt-4 overflow-hidden bg-[#0a0a0c] text-slate-300 font-sans selection:bg-indigo-500/30 rounded-t-xl border-x border-t border-white/5">
            {/* 1. LEFT TOOLBAR: Narrow & Technical */}
            <div className="w-[60px] flex flex-col items-center py-4 bg-[#141416] border-r border-white/5 space-y-4 shrink-0">
                <ToolButton active={activeTool === 'select'} onClick={() => setActiveTool('select')} icon={<MousePointer2 className="w-5 h-5" />} label="Select" />
                <div className="w-8 h-px bg-white/5 my-1" />
                <ToolButton active={activeTool === 'text'} onClick={() => { setActiveTool('text'); addText(); }} icon={<TypeIcon className="w-5 h-5" />} label="Text" />

                <label className="cursor-pointer group relative">
                    <ToolButton active={activeTool === 'image'} onClick={() => { }} icon={<ImageIcon className="w-5 h-5" />} label="Media" asDiv />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <ToolButton active={activeTool === 'emoji'} onClick={() => setActiveTool('emoji')} icon={<Smile className="w-5 h-5" />} label="Emoji" />

                <div className="flex-grow" />

                <ToolButton onClick={undo} icon={<Undo2 className="w-5 h-5" />} label="Undo" />
                <ToolButton onClick={redo} icon={<Redo2 className="w-5 h-5" />} label="Redo" />
                <ToolButton icon={<HelpCircle className="w-5 h-5" />} label="Help" />
            </div>

            {/* 2. MAIN WORKSPACE: Massive Center */}
            <div className="flex-grow flex flex-col min-w-0 bg-[#0a0a0c]">
                {/* Workspace Header */}
                <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#141416]/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold tracking-[0.2em] text-indigo-400 uppercase">Open Memes Editor</span>
                        <div className="h-4 w-px bg-white/10" />
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="bg-transparent border-none text-[11px] font-mono text-slate-400 uppercase focus:outline-none focus:text-white transition-colors w-48 hover:bg-white/5 px-2 py-0.5 rounded cursor-edit"
                            placeholder="PROJECT_NAME"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={downloadMeme} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all shadow-lg shadow-indigo-600/20">
                            <Download className="w-3.5 h-3.5" />
                            EXPORT
                        </button>
                    </div>
                </div>

                {/* Canvas Area with Infinite Grid */}
                <div ref={workspaceRef} className="flex-grow relative overflow-auto custom-scrollbar flex items-center justify-center p-24 bg-[#0a0a0c]">
                    {/* Infinite Grid Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                            backgroundImage: `linear-gradient(#1e1e22 1px, transparent 1px), linear-gradient(90deg, #1e1e22 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                            backgroundPosition: 'center center'
                        }}
                    />

                    {/* Canvas Container */}
                    <div className="relative group">
                        {/* The Canvas */}
                        <div className="shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10">
                            <canvas ref={canvasRef} />
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="h-8 border-t border-white/5 bg-[#141416] flex items-center justify-end px-4 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-[#1e1e22] px-2 py-0.5 rounded">
                            <ZoomOut className="w-3 h-3 cursor-pointer hover:text-white" />
                            <span className="font-mono">{Math.round(zoom * 100)}%</span>
                            <ZoomIn className="w-3 h-3 cursor-pointer hover:text-white" />
                        </div>
                        <span className="font-mono">800x600</span>
                    </div>
                </div>
            </div>

            {/* 3. RIGHT INSPECTOR: Properties & Layers */}
            <div className="w-[300px] bg-[#141416] border-l border-white/5 flex flex-col shrink-0">
                {/* Inspector Header */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Properties</span>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                    {selectedObject ? (
                        <div className="p-4 space-y-6">
                            {/* Color Property */}
                            <PropertySection label="Appearance">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Fill Color</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-400">{textColor}</span>
                                            <div className="w-6 h-6 rounded border border-white/10 overflow-hidden relative group">
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
                                            <button key={c} onClick={() => changeColor(c)} className="w-full aspect-square rounded border border-white/5" style={{ background: c }} />
                                        ))}
                                    </div>
                                </div>
                            </PropertySection>

                            {/* Font Property */}
                            {(selectedObject.type === 'textbox' || selectedObject.type === 'i-text') && (
                                <PropertySection label="Typography">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <select
                                                value={activeFont}
                                                onChange={(e) => changeFont(e.target.value)}
                                                className="w-full bg-[#1e1e22] border border-white/5 text-[11px] rounded px-3 py-2 outline-none appearance-none font-bold"
                                            >
                                                {FONTS.map(f => (
                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0]}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-slate-500 pointer-events-none" />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            <button className="p-2 bg-[#1e1e22] rounded hover:bg-[#252529] font-bold text-xs border border-white/5">B</button>
                                            <button className="p-2 bg-[#1e1e22] rounded hover:bg-[#252529] italic text-xs border border-white/5">I</button>
                                            <button className="p-2 bg-[#1e1e22] rounded hover:bg-[#252529] text-xs border border-white/5">U</button>
                                            <button className="p-2 bg-[#1e1e22] rounded hover:bg-[#252529] text-xs border border-white/5">S</button>
                                        </div>
                                    </div>
                                </PropertySection>
                            )}

                            {/* Actions */}
                            <PropertySection label="Selection Tools">
                                <div className="grid grid-cols-1 gap-2">
                                    <button onClick={deleteSelected} className="flex items-center justify-center gap-2 p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 text-[10px] font-bold tracking-widest transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                        DELETE OBJECT
                                    </button>
                                    <button onClick={() => { fabricCanvasRef.current.centerObject(selectedObject); fabricCanvasRef.current.renderAll(); }} className="p-2.5 bg-[#1e1e22] hover:bg-[#252529] text-slate-400 rounded border border-white/5 text-[10px] font-bold tracking-widest transition-all">
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

            {/* Floating Assets Drawer (Contextual) */}
            {activeTool === 'emoji' && (
                <div className="absolute left-[70px] top-4 bottom-4 w-64 bg-[#141416] border border-white/10 rounded-lg shadow-2xl z-50 flex flex-col animate-in slide-in-from-left-4 duration-200">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Emoji Assets</span>
                        <button onClick={() => setActiveTool('select')} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto custom-scrollbar">
                        {EMOJIS.map(e => (
                            <button key={e} onClick={() => addEmoji(e)} className="text-3xl hover:scale-125 transition-transform active:scale-95">{e}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolButton = ({ active, onClick, icon, label, asDiv }) => {
    const Component = asDiv ? 'div' : 'button';
    return (
        <Component
            onClick={onClick}
            title={label}
            className={cn(
                "p-3 rounded transition-all duration-200 group relative",
                active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 hover:bg-white/5 hover:text-white"
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

const PropertySection = ({ label, children }) => (
    <div className="space-y-4">
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">{label}</label>
        {children}
    </div>
);

export default MemeEditor;
