import type { SectionState, InstructorState, Section, Instructor, SectionAvailability } from '@/features/assignment/assignment.types';
import { useState } from 'react';
import PropertiesDialog from './propertiesDialog';
import { useSnapshots } from '@/features/assignment/useSnapshots';
import SnapshotsDialog from './snapshotsDialog';

export default function Toolbar({sectionState, instructorState, updateSection, updateInstructor, loadState, dropInstructor, saveCourseSections, addSection, removeSection}: {
  sectionState: SectionState,
  instructorState: InstructorState,
  updateSection: (updatedSection: Section) => void,
  updateInstructor: (updatedInstructor: Instructor) => void,
  loadState: (sectionState: SectionState, instructorState: InstructorState) => void,
  dropInstructor: (instructorId: string, dropped: boolean) => void,
  saveCourseSections: (courseId: string, sections: Array<{ id: string; capacity: number }>) => Promise<void>,
  addSection: (courseId: string, course_code: string, courseName: string, year_introduced: string, workload: number, availability: SectionAvailability) => Promise<void>,
  removeSection: (sectionId: string) => Promise<void>,
}) {

  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);
  const { snapshots, saveSnapshots, loadSnapshot, renameSnapshot, deleteSnapshot } = useSnapshots();

  return (
    <div className="flex justify-between items-center bg-[#1a1a1a] text-white px-8 py-4 border-b-2 border-[#2c2c2c]">
      {/* Left side - Logo and Schedule selector */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-4xl leading-none">Q</span>
          <span className="text-sm leading-tight tracking-wide">IC<br/>AS</span>
        </div>
        <select className="bg-[#2c2c2c] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c]">
          <option>2024-25 Schedule</option>
          <option>2023-24 Schedule</option>
          <option>2025-26 Schedule</option>
        </select>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex pl-40 gap-2">
        <button className="flex items-center gap-2 bg-transparent text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#2c2c2c] transition-colors">
          <span className="text-lg">📖</span>Tutorial
        </button>
        <button onClick={() => setIsPropertiesOpen(true)} className="flex items-center gap-2 bg-transparent text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#2c2c2c] transition-colors">
          <span className="text-lg">📄</span>Edit Properties
        </button>
        <button onClick={() => setIsSnapshotsOpen(true)} className="flex items-center gap-2 bg-transparent text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#2c2c2c] transition-colors">
          <span className="text-lg">📸</span>Snapshots
        </button>
        <button className="flex items-center gap-2 bg-transparent text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#2c2c2c] transition-colors">
          <span className="text-lg">📤</span>Export
        </button>
        <button className="flex items-center gap-2 bg-transparent text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#2c2c2c] transition-colors">
          <span className="text-lg">⚙️</span>Settings
        </button>
      </div>

      <PropertiesDialog
        isOpen={isPropertiesOpen}
        onClose={() => setIsPropertiesOpen(false)}
        sectionState={sectionState}
        instructorState={instructorState}
        onUpdateSection={updateSection}
        onUpdateInstructor={updateInstructor}
        onDropInstructor={dropInstructor}
        onSaveCourseSections={saveCourseSections}
        onAddSection={addSection}
        onRemoveSection={removeSection}
      />
      <SnapshotsDialog
        isOpen={isSnapshotsOpen}
        onClose={() => setIsSnapshotsOpen(false)}
        snapshots={snapshots}
        sectionState={sectionState}
        instructorState={instructorState}
        onSave={saveSnapshots}
        onLoad={loadSnapshot}
        onRename={renameSnapshot}
        onDelete={deleteSnapshot}
        onApplyLoad={loadState}
      />
    </div>
  );
}
