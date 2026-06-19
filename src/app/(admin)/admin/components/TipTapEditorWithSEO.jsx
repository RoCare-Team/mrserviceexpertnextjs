"use client";
import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
    Bold,
    Upload,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    ImageIcon,
    Link as LinkIcon,
    Unlink,
    Highlighter,
    X,
    Table as TableIcon,
    Trash2,
    Plus,
    Minus,
    Hash
} from 'lucide-react';

/* =========================================================
   CUSTOM ID EXTENSION
   Adds an `id` HTML attribute to the listed block-level
   node types. This lets you give any tag an id for
   anchor links / "jump to section" SEO.
   ========================================================= */
const CustomId = Extension.create({
    name: 'customId',

    addGlobalAttributes() {
        return [
            {
                // Only the node types that genuinely benefit from an id
                types: [
                    'heading',
                    'paragraph',
                    'blockquote',
                    'bulletList',
                    'orderedList',
                    'listItem',
                    'codeBlock',
                    'image',
                    'table',
                ],
                attributes: {
                    id: {
                        default: null,
                        // Read id from pasted / loaded HTML
                        parseHTML: (element) => element.getAttribute('id') || null,
                        // Write id back into the HTML output
                        renderHTML: (attributes) => {
                            if (!attributes.id) return {};
                            return { id: attributes.id };
                        },
                    },
                },
            },
        ];
    },
});

/* =========================================================
   IMAGE MODAL
   ========================================================= */
const ImageModal = ({ isOpen, onClose, onSave, existingImage }) => {
    const [src, setSrc] = useState('');
    const [alt, setAlt] = useState('');
    const [title, setTitle] = useState('');
    const [uploadPreview, setUploadPreview] = useState(null);
    const fileInputRef = useRef(null);

    React.useEffect(() => {
        if (isOpen) {
            setSrc(existingImage?.src || '');
            setAlt(existingImage?.alt || '');
            setTitle(existingImage?.title || '');
            setUploadPreview(null);
        }
    }, [isOpen, existingImage]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setSrc(ev.target.result);
            setUploadPreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file?.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setSrc(ev.target.result);
                setUploadPreview(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!src.trim()) {
            alert('Please provide an image (upload or URL)');
            return;
        }
        onSave({ src, alt, title });
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Insert Image</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">

                    {/* Upload Area */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Image
                        </label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                        >
                            {uploadPreview ? (
                                <div className="space-y-2">
                                    <img
                                        src={uploadPreview}
                                        alt="Preview"
                                        className="max-h-32 mx-auto rounded object-contain"
                                    />
                                    <p className="text-xs text-green-600 font-medium">
                                        ✓ Image loaded — you can still change it
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                    <p className="text-sm text-gray-600">
                                        Click to upload or drag & drop
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        PNG, JPG, WebP up to 5MB
                                    </p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="text-xs text-gray-400 font-medium">OR</span>
                        <div className="flex-1 border-t border-gray-200" />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image URL
                        </label>
                        <input
                            type="url"
                            value={uploadPreview ? '' : src}
                            onChange={(e) => {
                                setSrc(e.target.value);
                                setUploadPreview(null);
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">
                            SEO Fields
                        </p>
                    </div>

                    {/* Alt Text - Most important for SEO */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alt Text
                            <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                Most important for SEO
                            </span>
                        </label>
                        <input
                            type="text"
                            value={alt}
                            onChange={(e) => setAlt(e.target.value)}
                            placeholder="e.g. RO water purifier installation technician in Delhi"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Describes the image for search engines and screen readers. Include your target keyword naturally.
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                            <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                Shown on hover
                            </span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Professional RO Service Near You"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Shows as a tooltip when user hovers over the image. Reinforces the image context.
                        </p>
                    </div>

                    {/* SEO tip */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800 font-medium mb-1">💡 SEO Tips</p>
                        <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                            <li>Alt text should describe what's in the image clearly</li>
                            <li>Include your main keyword in the alt text naturally</li>
                            <li>Keep alt text under 125 characters</li>
                            <li>Don't start with "image of" or "photo of"</li>
                        </ul>
                    </div>

                    {/* Character count for alt */}
                    {alt && (
                        <p className={`text-xs ${alt.length > 125 ? 'text-red-500' : 'text-gray-400'}`}>
                            Alt text: {alt.length}/125 characters
                            {alt.length > 125 && ' — Too long!'}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                        >
                            Insert Image
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   LINK MODAL
   ========================================================= */
const LinkModal = ({ isOpen, onClose, onSave, currentLink }) => {
    const [url, setUrl] = useState(currentLink?.href || '');
    const [linkType, setLinkType] = useState(currentLink?.rel || 'follow');

    React.useEffect(() => {
        if (isOpen) {
            setUrl(currentLink?.href || '');
            setLinkType(currentLink?.rel || 'follow');
        }
    }, [isOpen, currentLink]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (url.trim()) {
            onSave({ href: url, rel: linkType });
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Insert/Edit Link</h3>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL *
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link Type (SEO)
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    rel="follow"
                                    value="follow"
                                    checked={linkType === 'follow'}
                                    onChange={(e) => setLinkType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">
                                    <strong>Follow</strong> - Allow search engines to follow (default)
                                </span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    rel="nofollow"
                                    value="nofollow"
                                    checked={linkType === 'nofollow'}
                                    onChange={(e) => setLinkType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">
                                    <strong>NoFollow</strong> - Don't pass SEO value
                                </span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="nofollow noindex"
                                    rel="nofollow noindex"
                                    checked={linkType === 'nofollow noindex'}
                                    onChange={(e) => setLinkType(e.target.value)}
                                    className="mr-2"
                                />
                                <span className="text-sm">
                                    <strong>NoFollow NoIndex</strong> - Don't follow or index
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSubmit(e);
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            type="button"
                        >
                            Insert Link
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                            type="button"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* =========================================================
   ID MODAL
   Set / update / remove the id on the currently active tag.
   ========================================================= */
const IdModal = ({ isOpen, onClose, onSave, onRemove, currentId, nodeType }) => {
    const [id, setId] = useState(currentId || '');

    React.useEffect(() => {
        if (isOpen) setId(currentId || '');
    }, [isOpen, currentId]);

    if (!isOpen) return null;

    // ids cannot contain spaces or most special chars
    const sanitize = (val) =>
        val
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9\-_:.]/g, '');

    const cleanId = sanitize(id);

    const handleSave = () => {
        onSave(cleanId || null);
        onClose();
    };

    const handleRemove = () => {
        onRemove();
        onClose();
    };

    const friendlyName = nodeType
        ? nodeType.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
        : null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Set Tag ID</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {nodeType ? (
                    <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                            Applying ID to current tag:{' '}
                            <span className="font-semibold text-blue-700">&lt;{friendlyName}&gt;</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ID
                                <span className="ml-2 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    For anchor links #section
                                </span>
                            </label>
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSave();
                                    }
                                }}
                                placeholder="e.g. ro-service-process"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                autoFocus
                            />
                            {id && cleanId !== id && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Will be saved as: <code className="bg-amber-50 px-1 rounded">{cleanId}</code>
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                No spaces. Use lowercase words separated by hyphens. Then link to it like{' '}
                                <code className="bg-gray-100 px-1 rounded">#{cleanId || 'your-id'}</code>.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                            >
                                Save ID
                            </button>
                            {currentId && (
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
                                >
                                    Remove ID
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Place your cursor inside a heading, paragraph, list, quote, table or image first,
                            then click this button to give it an ID.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* =========================================================
   MENU BAR
   ========================================================= */
const MenuBar = ({ editor, onChange }) => {
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [currentLink, setCurrentLink] = useState(null);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [existingImage, setExistingImage] = useState(null);
    const [showTableMenu, setShowTableMenu] = useState(false);
    const [showHtmlPaste, setShowHtmlPaste] = useState(false);
    const [rawHtml, setRawHtml] = useState('');

    // ID modal state
    const [idModalOpen, setIdModalOpen] = useState(false);
    const [currentNodeId, setCurrentNodeId] = useState('');
    const [currentNodeType, setCurrentNodeType] = useState(null);

    if (!editor) {
        return null;
    }

    const openImageModal = () => {
        const attrs = editor.getAttributes('image');
        setExistingImage(attrs.src ? attrs : null);
        setImageModalOpen(true);
    };

    const handleSaveImage = ({ src, alt, title }) => {
        editor.chain().focus().setImage({ src, alt, title }).run();
    };

    const openLinkModal = () => {
        const attrs = editor.getAttributes('link');
        setCurrentLink(attrs.href ? attrs : null);
        setLinkModalOpen(true);
    };

    const handleSaveLink = ({ href, rel }) => {
        if (!href) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        // in-page anchor link? (jaise #contact, #ro-service-process)
        const isAnchor = href.trim().startsWith('#');

        const attributes = {
            href: href.trim(),
            // anchor -> same tab (no _blank); external -> new tab
            target: isAnchor ? null : '_blank',
            // anchor links ko nofollow/SEO rel ki zaroorat nahi
            rel: isAnchor ? null : (rel === 'follow' ? null : rel),
        };

        editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink(attributes)
            .run();
    };

    // ----- ID helpers -----
    // List of node types that we allow an id on (must match CustomId extension)
    const ID_TYPES = [
        'heading',
        'paragraph',
        'blockquote',
        'bulletList',
        'orderedList',
        'listItem',
        'codeBlock',
        'image',
        'table',
    ];

    // Figure out which block node the cursor is currently in
    const getActiveIdNode = () => {
        const { selection } = editor.state;

        // Case 1: a node (like an image) is directly selected
        if (selection.node && ID_TYPES.includes(selection.node.type.name)) {
            return { type: selection.node.type.name, node: selection.node };
        }

        // Case 2: walk up from the cursor to find the closest allowed block
        const { $from } = selection;
        for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (ID_TYPES.includes(node.type.name)) {
                return { type: node.type.name, node };
            }
        }
        return { type: null, node: null };
    };

    const openIdModal = () => {
        const { type, node } = getActiveIdNode();
        setCurrentNodeType(type);
        setCurrentNodeId(node?.attrs?.id || '');
        setIdModalOpen(true);
    };

    const handleSaveId = (id) => {
        if (!currentNodeType) return;
        editor.chain().focus().updateAttributes(currentNodeType, { id }).run();
    };

    const handleRemoveId = () => {
        if (!currentNodeType) return;
        editor.chain().focus().updateAttributes(currentNodeType, { id: null }).run();
    };

    return (
        <>
            <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50 rounded-t-lg sticky top-0 z-10">
                {/* Text Formatting */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bold') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Bold"
                    type="button"
                >
                    <Bold size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('italic') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Italic"
                    type="button"
                >
                    <Italic size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('underline') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Underline"
                    type="button"
                >
                    <UnderlineIcon size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('strike') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Strikethrough"
                    type="button"
                >
                    <Strikethrough size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    disabled={!editor.can().chain().focus().toggleCode().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('code') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Inline Code"
                    type="button"
                >
                    <Code size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Headings */}
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Heading 2"
                    type="button"
                >
                    <Heading2 size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Heading 3"
                    type="button"
                >
                    <Heading3 size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bulletList') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Bullet List"
                    type="button"
                >
                    <List size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('orderedList') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Numbered List"
                    type="button"
                >
                    <ListOrdered size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('blockquote') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Blockquote"
                    type="button"
                >
                    <Quote size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Alignment */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Align Left"
                    type="button"
                >
                    <AlignLeft size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Align Center"
                    type="button"
                >
                    <AlignCenter size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Align Right"
                    type="button"
                >
                    <AlignRight size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Justify"
                    type="button"
                >
                    <AlignJustify size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Link & Image */}
                <button
                    onClick={openLinkModal}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('link') ? 'bg-blue-200 text-blue-700' : ''
                        }`}
                    title="Add Link"
                    type="button"
                >
                    <LinkIcon size={18} />
                </button>

                <button
                    onClick={() => editor.chain().focus().unsetLink().run()}
                    disabled={!editor.isActive('link')}
                    className="p-2 rounded hover:bg-gray-200 transition disabled:opacity-30"
                    title="Remove Link"
                    type="button"
                >
                    <Unlink size={18} />
                </button>

                <button
                    onClick={openImageModal}
                    className="p-2 rounded hover:bg-gray-200 transition"
                    title="Insert Image"
                    type="button"
                >
                    <ImageIcon size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* SET TAG ID */}
                <button
                    onClick={openIdModal}
                    className={`p-2 rounded hover:bg-gray-200 transition ${getActiveIdNode().node?.attrs?.id ? 'bg-green-200 text-green-700' : ''
                        }`}
                    title="Set ID on current tag"
                    type="button"
                >
                    <Hash size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Table Controls */}
                <div className="relative">
                    <button
                        onClick={() => setShowTableMenu(!showTableMenu)}
                        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('table') ? 'bg-blue-200 text-blue-700' : ''
                            }`}
                        title="Table"
                        type="button"
                    >
                        <TableIcon size={18} />
                    </button>

                    {showTableMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-20 min-w-[200px]">
                            <button
                                onClick={() => {
                                    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                            >
                                <Plus size={16} />
                                Insert Table (3x3)
                            </button>
                            <button
                                onClick={() => {
                                    editor.chain().focus().addColumnBefore().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().addColumnBefore()}
                            >
                                <Plus size={16} />
                                Add Column Before
                            </button>
                            <button
                                onClick={() => {
                                    editor.chain().focus().addColumnAfter().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().addColumnAfter()}
                            >
                                <Plus size={16} />
                                Add Column After
                            </button>
                            <button
                                onClick={() => {
                                    editor.chain().focus().deleteColumn().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().deleteColumn()}
                            >
                                <Minus size={16} />
                                Delete Column
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                onClick={() => {
                                    editor.chain().focus().addRowBefore().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().addRowBefore()}
                            >
                                <Plus size={16} />
                                Add Row Before
                            </button>
                            <button
                                onClick={() => {
                                    editor.chain().focus().addRowAfter().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().addRowAfter()}
                            >
                                <Plus size={16} />
                                Add Row After
                            </button>
                            <button
                                onClick={() => {
                                    editor.chain().focus().deleteRow().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().deleteRow()}
                            >
                                <Minus size={16} />
                                Delete Row
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                onClick={() => {
                                    editor.chain().focus().deleteTable().run();
                                    setShowTableMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-red-100 text-red-600 rounded text-sm flex items-center gap-2"
                                type="button"
                                disabled={!editor.can().deleteTable()}
                            >
                                <Trash2 size={16} />
                                Delete Table
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Highlight */}
                <button
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('highlight') ? 'bg-yellow-200 text-yellow-700' : ''
                        }`}
                    title="Highlight"
                    type="button"
                >
                    <Highlighter size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                {/* Undo/Redo */}
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    className="p-2 rounded hover:bg-gray-200 transition disabled:opacity-30"
                    title="Undo"
                    type="button"
                >
                    <Undo size={18} />
                </button>

                <div className="w-px bg-gray-300 mx-1"></div>

                <button
                    onClick={() => setShowHtmlPaste(true)}
                    className="p-2 rounded hover:bg-gray-200 transition text-xs font-bold text-gray-600"
                    title="Paste Raw HTML"
                    type="button"
                >
                    {'</>'}
                </button>

                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    className="p-2 rounded hover:bg-gray-200 transition disabled:opacity-30"
                    title="Redo"
                    type="button"
                >
                    <Redo size={18} />
                </button>
            </div>

            <LinkModal
                isOpen={linkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onSave={handleSaveLink}
                currentLink={currentLink}
            />
            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                onSave={handleSaveImage}
                existingImage={existingImage}
            />
            <IdModal
                isOpen={idModalOpen}
                onClose={() => setIdModalOpen(false)}
                onSave={handleSaveId}
                onRemove={handleRemoveId}
                currentId={currentNodeId}
                nodeType={currentNodeType}
            />

            {showHtmlPaste && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowHtmlPaste(false); }}
                >
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Paste Raw HTML</h3>
                            <button onClick={() => setShowHtmlPaste(false)} type="button">
                                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>
                        <textarea
                            value={rawHtml}
                            onChange={(e) => setRawHtml(e.target.value)}
                            rows={12}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Paste your HTML here..."
                            autoFocus
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    if (rawHtml.trim()) {
                                        editor.commands.setContent(rawHtml, false);
                                        onChange(rawHtml);
                                    }
                                    setRawHtml('');
                                    setShowHtmlPaste(false);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Insert HTML
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRawHtml(''); setShowHtmlPaste(false); }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/* =========================================================
   MAIN EDITOR
   ========================================================= */
const TipTapEditorWithSEO = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Image,
            Link.configure({
                openOnClick: false,
                autolink: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                    // ye dono null karne se default _blank / rel forced nahi rahega
                    target: null,
                    rel: null,
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse table-auto w-full',
                },
            }),
            TableRow,
            TableHeader,
            TableCell,
            CustomId, // <-- enables id attribute on tags
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none p-4',
            },
        },
        immediatelyRender: false,
    });

    // Update editor content when prop changes
    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            <MenuBar editor={editor} onChange={onChange} />
            <EditorContent editor={editor} className="min-h-[300px] max-h-[500px] overflow-y-auto" />

            {/* Table Styling */}
            <style jsx global>{`
                .ProseMirror table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                    margin: 1rem 0;
                    overflow: hidden;
                }

                .ProseMirror td,
                .ProseMirror th {
                    min-width: 1em;
                    border: 2px solid #d1d5db;
                    padding: 8px 12px;
                    vertical-align: top;
                    box-sizing: border-box;
                    position: relative;
                }

                .ProseMirror th {
                    font-weight: bold;
                    text-align: left;
                    background-color: #f3f4f6;
                }

                .ProseMirror .selectedCell:after {
                    z-index: 2;
                    position: absolute;
                    content: "";
                    left: 0;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    background: rgba(200, 200, 255, 0.4);
                    pointer-events: none;
                }

                .ProseMirror .column-resize-handle {
                    position: absolute;
                    right: -2px;
                    top: 0;
                    bottom: -2px;
                    width: 4px;
                    background-color: #3b82f6;
                    pointer-events: none;
                }

                .ProseMirror.resize-cursor {
                    cursor: ew-resize;
                    cursor: col-resize;
                }
            `}</style>
        </div>
    );
};

export default TipTapEditorWithSEO;