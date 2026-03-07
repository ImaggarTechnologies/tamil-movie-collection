import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import {
    Upload, Type, Download, Trash2, RotateCcw, Image as ImageIcon,
    Smile, Palette, Undo2, Redo2
} from 'lucide-react';

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
    '🚀', '🛸', '🌈', '☀️', '🌕', '🍀', '🍕', '🍻',
    '🎮', '🎸', '📱', '💰', '💎', '🧊', '⚡'
];

const MemeEditor = () => {
    const canvasRef = useRef(null);
    const fabricCanvasRef = useRef(null);
    const [selectedObject, setSelectedObject] = useState(null);
    const [textColor, setTextColor] = useState('#ffffff');
    const [activeFont, setActiveFont] = useState(FONTS[0]);

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
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: 800,
            height: 600,
            backgroundColor: '#0f172a',
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
            const isEditing = active && active.isEditing;
            if (isEditing) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteSelected();
            }
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
            });

            fabricCanvasRef.current.add(img);
            fabricCanvasRef.current.setActiveObject(img);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const addText = () => {
        const text = new fabric.Textbox('Double click to edit', {
            left: 100,
            top: 100,
            width: 300,
            fontSize: 40,
            fill: textColor,
            fontFamily: activeFont,
            textAlign: 'center',
            stroke: '#000000',
            strokeWidth: 2,
            fontWeight: 'bold',
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const addEmoji = (emoji) => {
        const text = new fabric.Textbox(emoji, {
            left: 150,
            top: 150,
            width: 100,
            fontSize: 80,
        });
        fabricCanvasRef.current.add(text);
        fabricCanvasRef.current.setActiveObject(text);
    };

    const clearCanvas = () => {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.backgroundColor = '#0f172a';
        fabricCanvasRef.current.renderAll();
        saveHistory();
    };

    const downloadMeme = () => {
        const dataURL = fabricCanvasRef.current.toDataURL({
            format: 'png',
            quality: 1,
        });
        const link = document.createElement('a');
        link.download = 'meme-openmemes.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const changeColor = (color) => {
        setTextColor(color);
        const active = fabricCanvasRef.current.getActiveObject();
        if (active && (active.type === 'textbox' || active.type === 'i-text')) {
            active.set('fill', color);
            fabricCanvasRef.current.renderAll();
            saveHistory();
        }
    };

    const changeFont = (font) => {
        setActiveFont(font);
        const active = fabricCanvasRef.current.getActiveObject();
        if (active && (active.type === 'textbox' || active.type === 'i-text')) {
            active.set('fontFamily', font);
            fabricCanvasRef.current.renderAll();
            saveHistory();
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-80 space-y-6">
                <div className="glass p-6 rounded-2xl border border-slate-800 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Editor Tools</h2>
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 grayscale opacity-70">
                                🎨 Meme Studio
                            </p>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={undo}
                                title="Undo (Ctrl+Z)"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 disabled:opacity-30"
                            >
                                <Undo2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={redo}
                                title="Redo (Ctrl+Y)"
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700 disabled:opacity-30"
                            >
                                <Redo2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            <label className="flex items-center justify-center gap-3 w-full p-3 rounded-xl cursor-pointer transition-all shadow-lg group bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20">
                                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium">Upload Image</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>

                            <button
                                onClick={addText}
                                className="flex items-center justify-center gap-3 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700 group"
                            >
                                <Type className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="font-medium text-sm">Add Text</span>
                            </button>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Color & Style
                            </label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => changeColor(e.target.value)}
                                    className="w-10 h-10 rounded-lg bg-transparent border border-slate-700 cursor-pointer overflow-hidden p-0"
                                />
                                <select
                                    value={activeFont}
                                    onChange={(e) => changeFont(e.target.value)}
                                    className="flex-grow bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none custom-select"
                                >
                                    {FONTS.map(font => (
                                        <option key={font} value={font} style={{ fontFamily: font }}>
                                            {font.split(',')[0]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-2">
                            <Smile className="w-3 h-3" /> Emojis
                        </label>
                        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => addEmoji(emoji)}
                                    className="w-10 h-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700 rounded-lg border border-slate-700/50 transition-colors text-xl hover:scale-110 active:scale-95"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                        <button
                            onClick={deleteSelected}
                            className="flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 group"
                        >
                            <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span className="font-semibold text-xs">Delete</span>
                        </button>

                        <button
                            onClick={clearCanvas}
                            className="flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all border border-slate-700 group"
                        >
                            <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
                            <span className="font-semibold text-xs">Clear</span>
                        </button>
                    </div>
                </div>

                <button
                    onClick={downloadMeme}
                    className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all shadow-xl shadow-emerald-600/20 group hover:-translate-y-1 active:translate-y-0"
                >
                    <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                    <span className="text-lg font-bold">Download Meme</span>
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-grow flex flex-col items-center">
                <div className="glass p-2 rounded-2xl border border-slate-800 shadow-2xl relative group">
                    <canvas ref={canvasRef} className="rounded-xl shadow-inner max-w-full h-auto" />

                    {fabricCanvasRef.current && fabricCanvasRef.current.getObjects().length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20 group-hover:opacity-10 transition-opacity">
                            <ImageIcon className="w-24 h-24 text-slate-400 mb-4" />
                            <p className="text-xl font-bold text-slate-400 uppercase tracking-tighter">Your Meme Canvas</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Delete</kbd> Remove Selected</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Ctrl+Z</kbd> Undo</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Ctrl+Y</kbd> Redo</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemeEditor;
