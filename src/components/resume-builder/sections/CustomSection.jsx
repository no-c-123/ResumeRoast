import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { InputField } from '../ui/InputField';
import { RichTextEditor } from '../ui/RichTextEditor';
import { SortableItem } from '../ui/SortableItem';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const CustomSection = ({
    section,
    updateSection,
    removeSection,
    expandedSections,
    toggleSection,
    handleAIImprove,
    improvingSection,
    aiImprovements
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = section.items.findIndex((item) => item.id === active.id);
            const newIndex = section.items.findIndex((item) => item.id === over.id);
            updateSection(section.id, {
                ...section,
                items: arrayMove(section.items, oldIndex, newIndex)
            });
        }
    };

    const updateItem = (itemId, field, value) => {
        const newItems = section.items.map(item => 
            item.id === itemId ? { ...item, [field]: value } : item
        );
        updateSection(section.id, { ...section, items: newItems });
    };

    const addItem = () => {
        const newItem = {
            id: crypto.randomUUID(),
            title: '',
            subtitle: '',
            description: ''
        };
        updateSection(section.id, { ...section, items: [...section.items, newItem] });
    };

    const removeItem = (itemId) => {
        updateSection(section.id, {
            ...section,
            items: section.items.filter(item => item.id !== itemId)
        });
    };

    return (
        <div className="bg-[#1a1a1a] border-l-4 border-purple-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader
                icon="📌"
                title={section.name || "Custom Section"}
                subtitle={`${section.items.length} items`}
                isComplete={section.items.length > 0}
                isOpen={expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
            />
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections[section.id] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    <div className="flex gap-4 items-end mb-6">
                        <div className="flex-1">
                            <InputField
                                label="Section Title"
                                value={section.name}
                                onChange={(e) => updateSection(section.id, { ...section, name: e.target.value })}
                                placeholder="e.g. Certifications, Awards, Languages"
                            />
                        </div>
                        <button 
                            onClick={() => removeSection(section.id)}
                            className="px-4 py-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 border border-red-500/20"
                        >
                            Delete Section
                        </button>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={section.items.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {section.items.map((item, i) => (
                                <SortableItem key={item.id} id={item.id}>
                                    <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm">Item {i + 1}</h4>
                                            <button
                                                className="text-red-500 hover:text-red-400 text-xs"
                                                onClick={() => removeItem(item.id)}
                                            >Remove</button>
                                        </div>

                                        <InputField
                                            label="Title"
                                            value={item.title}
                                            onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                            placeholder="e.g. AWS Certified Solutions Architect"
                                        />

                                        <InputField
                                            label="Subtitle / Date"
                                            value={item.subtitle}
                                            onChange={(e) => updateItem(item.id, 'subtitle', e.target.value)}
                                            placeholder="e.g. 2023"
                                        />

                                        <RichTextEditor
                                            label="Description (Optional)"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                            placeholder="Additional details..."
                                            maxLength={300}
                                            aiAssist={true}
                                            onImprove={() => handleAIImprove(`${section.id}-${item.id}`, item.description, 'Improve this description.', 300)}
                                            isImproving={improvingSection === `${section.id}-${item.id}`}
                                            improvementResult={aiImprovements[`${section.id}-${item.id}`]}
                                        />
                                    </div>
                                </SortableItem>
                            ))}
                        </SortableContext>
                    </DndContext>

                    <button
                        className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all"
                        onClick={addItem}
                    >
                        + Add Item
                    </button>
                </div>
            </div>
        </div>
    );
};
