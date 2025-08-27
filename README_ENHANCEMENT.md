# AFMC Schedule App - OCR Enhancement

## Overview
Successfully enhanced the existing AFMC Training Schedule application with document upload and OCR extraction capabilities.

## New Features Added

### 1. Enhanced Admin Interface (`admin.html`)
- **Multi-tab Interface**: Added three distinct modes:
  - 📄 **Upload Image/PDF**: For processing document files
  - 📝 **Text Demo**: For testing text parsing algorithms
  - ✏️ **Manual Entry**: Original manual data input (preserved)

### 2. Document Processing Capabilities
- **File Upload Support**: 
  - Image formats: JPG, PNG (up to 10MB)
  - PDF support with automatic page-to-image conversion
  - Drag & drop interface with visual feedback

- **OCR Integration**:
  - Client-side OCR using Tesseract.js (cost-free solution)
  - Real-time progress tracking during processing
  - PDF.js integration for PDF-to-image conversion

### 3. Intelligent Text Parsing
Advanced parsing algorithm that extracts:
- **Dates**: Multiple format support (DD/MM/YYYY, Day DD/MM/YYYY)
- **Times**: Start and end times (HH:MM - HH:MM format)
- **Subjects**: Class topics and session types
- **Instructors**: Professor/Doctor names and titles
- **Locations**: Rooms, halls, labs, and other venues
- **Departments**: Automatic classification into medical departments
- **Special Events**: Holiday detection and handling

### 4. Data Structure Compatibility
All extracted data maintains compatibility with existing schedule format:
```javascript
{
  date: "2024-12-16",           // YYYY-MM-DD format
  startTime: "09:00",           // HH:MM format
  endTime: "10:00",             // HH:MM format
  topic: "Internal Medicine Lecture",
  department: "Internal Medicine",
  instructor: "Dr. Sharma",
  location: "Hall A",
  batch: ["ALL"],
  isHoliday: false,
  isClinic: false
}
```

## Sample Schedule Format Supported

```
AFMC Weekly Training Schedule
Week of December 15-21, 2024

Monday 16/12/2024
09:00 - 10:00  Internal Medicine Lecture - Dr. Sharma - Hall A
10:30 - 11:30  Community Medicine Practical - Prof. Kumar - Lab 1
14:00 - 15:00  Ophthalmology Tutorial - Dr. Patel - Room 205

Thursday 19/12/2024
HOLIDAY - National Day

Friday 20/12/2024
10:00 - 11:00  Ophthalmology Surgery Demo - Dr. Patel - OR 1
```

## Technical Implementation

### Libraries Added
- **Tesseract.js 5.0**: Client-side OCR processing
- **PDF.js 3.11**: PDF parsing and image conversion

### Key Functions
- `parseScheduleText()`: Main parsing logic
- `extractDateFromLine()`: Date extraction with multiple format support
- `parseScheduleLine()`: Individual schedule entry parsing
- `extractDepartmentFromText()`: Medical department classification
- `processFiles()`: File handling and OCR pipeline

### Processing Pipeline
1. **File Upload** → Validation (type, size)
2. **Format Conversion** → PDF to image if needed
3. **OCR Processing** → Extract text using Tesseract.js
4. **Text Parsing** → Structure extraction with smart algorithms
5. **Data Preview** → JSON format with edit capability
6. **Firebase Integration** → Save to existing database

## User Experience
- **Progress Tracking**: Real-time OCR progress with percentage
- **Error Handling**: Comprehensive validation and user feedback
- **Data Review**: Preview and edit extracted data before saving
- **Batch Processing**: Multiple file upload support
- **Original Functionality Preserved**: All existing features intact

## Cost Benefits
- **Zero API Costs**: Client-side OCR processing
- **No External Dependencies**: Self-contained solution
- **Scalable**: Handles multiple document formats
- **Reliable**: Fallback to manual entry always available

## Usage Instructions
1. Navigate to `admin.html`
2. Enter admin password: `afmc`
3. Select "Upload Image/PDF" tab
4. Upload schedule documents (images or PDFs)
5. Wait for OCR processing to complete
6. Review and edit extracted data
7. Click "Save Extracted Data" to add to schedule

## Integration with Existing App
- Maintains all existing functionality in `index.html`
- Uses same Firebase database structure
- Preserves student roll number features
- Compatible with calendar export functionality
- No changes to main user interface