import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { InputField } from '../ui/InputField';
import { TextArea } from '../ui/TextArea';
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

export const ProjectsSection = ({
    projects,
    setProjects,
    expandedSections,
    toggleSection,
    improvingSection,
    aiImprovements,
    handleAIImprove
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
            const oldIndex = projects.findIndex((item) => item.id === active.id);
            const newIndex = projects.findIndex((item) => item.id === over.id);
            setProjects(arrayMove(projects, oldIndex, newIndex));
        }
    };

    return (
        <div className="bg-[#1a1a1a] border-l-4 border-pink-500 rounded-r-xl overflow-hidden mb-6">
            <SectionHeader
                icon="🚀"
                title="Projects"
                subtitle={`${projects.length} projects added`}
                isComplete={projects.length > 0}
                isOpen={expandedSections['projects']}
                onToggle={() => toggleSection('projects')}
            />
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedSections['projects'] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="bg-[#151515] border-t border-neutral-800 p-6 space-y-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={projects.map(p => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {projects.map((proj, i) => (
                                <SortableItem key={proj.id} id={proj.id}>
                                    <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 space-y-4 h-[600px]">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm">Project {i + 1}</h4>
                                            <button
                                                className="text-red-500 hover:text-red-400 text-xs"
                                                onClick={() => {
                                                    const newProjects = projects.filter((_, idx) => idx !== i);
                                                    setProjects(newProjects);
                                                }}
                                            >Remove</button>
                                        </div>

                                        <InputField
                                            label="Project Title"
                                            value={proj.title}
                                            onChange={(e) => {
                                                const newProjects = [...projects];
                                                newProjects[i] = { ...newProjects[i], title: e.target.value };
                                                setProjects(newProjects);
                                            }}
                                            placeholder="e.g. Portfolio Website"
                                        />

                                        <TextArea
                                            label="Description"
                                            value={proj.description}
                                            onChange={(e) => {
                                                const newProjects = [...projects];
                                                newProjects[i] = { ...newProjects[i], description: e.target.value };
                                                setProjects(newProjects);
                                            }}
                                            placeholder="Describe what you built..."
                                            maxLength={600}
                                            aiAssist={true}
                                            onImprove={() => handleAIImprove(`project-${i}`, proj.description, 'Improve this project description. Use strong action verbs, quantify impact (e.g. "Increased efficiency by 20%"), and highlight technologies used.', 700)}
                                            isImproving={improvingSection === `project-${i}`}
                                            improvementResult={aiImprovements[`project-${i}`]}
                                        />
                                    </div>
                                </SortableItem>
                            ))}
                        </SortableContext>
                    </DndContext>

                    <button
                        className="w-full py-3 bg-neutral-800 text-neutral-400 rounded-lg border border-neutral-700 border-dashed hover:text-white hover:border-neutral-500 transition-all"
                        onClick={() => {
                            const newProj = {
                                id: crypto.randomUUID(),
                                title: '',
                                description: '',
                                link: ''
                            };
                            setProjects([...projects, newProj]);
                        }}
                    >
                        + Add Project
                    </button>
                </div>
            </div>
        </div>
    );
};
