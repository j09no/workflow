import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderPlus, Upload, FileText, Image, Download, Search, MoreVertical, Folder, ArrowLeft, Trash2, Database, Save, RefreshCw, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFiles, getFolders, createFile, createFolder, deleteFile, deleteFolder, downloadDatabase, uploadDatabase, clearAllData, createBackup, getBackups, restoreBackup } from "../lib/sql-api-functions";
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { DatabaseManager } from '@/components/database-manager';
import { neon } from '@neondatabase/serverless';

interface FileItem {
  id: number;
  name: string;
  type: "folder" | "pdf" | "image" | "document";
  size?: string;
  modified: string;
  path: string;
}

export default function Storage() {
  const [currentPath, setCurrentPath] = useState("/");
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);
  const [backups, setBackups] = useState<string[]>([]);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'file' | 'folder';
    item: any;
  }>({ isOpen: false, type: 'file', item: null });

  // Neon database setup
  const neonUrl = import.meta.env.VITE_DATABASE_URL;
  const sql = neonUrl ? neon(neonUrl) : null;

  const initNeonDatabase = async () => {
    if (!sql) {
      console.log('Neon not configured for storage, using SQL.js fallback');
      return;
    }
    try {
      // Create files table
      await sql(`
        CREATE TABLE IF NOT EXISTS files (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          size TEXT,
          path TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create folders table
      await sql(`
        CREATE TABLE IF NOT EXISTS folders (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Neon storage tables initialized successfully');
    } catch (error) {
      console.error('Error initializing Neon storage tables:', error);
    }
  };

  const getNeonFiles = async (): Promise<FileItem[]> => {
    if (!sql) {
      const stored = localStorage.getItem('storage_files');
      return stored ? JSON.parse(stored) : [];
    }
    
    try {
      const result = await sql('SELECT * FROM files ORDER BY created_at DESC');
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type as FileItem['type'],
        size: row.size,
        modified: new Date(row.created_at).toLocaleDateString(),
        path: row.path
      }));
    } catch (error) {
      console.error('Error getting files from Neon:', error);
      return [];
    }
  };

  const getNeonFolders = async (): Promise<FileItem[]> => {
    if (!sql) {
      const stored = localStorage.getItem('storage_folders');
      return stored ? JSON.parse(stored) : [];
    }
    
    try {
      const result = await sql('SELECT * FROM folders ORDER BY created_at DESC');
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: "folder" as const,
        modified: new Date(row.created_at).toLocaleDateString(),
        path: row.path
      }));
    } catch (error) {
      console.error('Error getting folders from Neon:', error);
      return [];
    }
  };

  const createNeonFile = async (fileData: { name: string; type: string; size?: string; path: string }): Promise<FileItem> => {
    const newFile = {
      id: Date.now(),
      name: fileData.name,
      type: fileData.type as FileItem['type'],
      size: fileData.size,
      modified: new Date().toLocaleDateString(),
      path: fileData.path
    };

    if (!sql) {
      const stored = localStorage.getItem('storage_files');
      const files = stored ? JSON.parse(stored) : [];
      files.push(newFile);
      localStorage.setItem('storage_files', JSON.stringify(files));
      return newFile;
    }
    
    try {
      const result = await sql(
        'INSERT INTO files (name, type, size, path) VALUES ($1, $2, $3, $4) RETURNING *',
        [fileData.name, fileData.type, fileData.size || null, fileData.path]
      );
      return {
        id: result[0].id,
        name: result[0].name,
        type: result[0].type as FileItem['type'],
        size: result[0].size,
        modified: new Date(result[0].created_at).toLocaleDateString(),
        path: result[0].path
      };
    } catch (error) {
      console.error('Error creating file in Neon:', error);
      throw error;
    }
  };

  const createNeonFolder = async (folderData: { name: string; path: string }): Promise<FileItem> => {
    const newFolder = {
      id: Date.now(),
      name: folderData.name,
      type: "folder" as const,
      modified: new Date().toLocaleDateString(),
      path: folderData.path
    };

    if (!sql) {
      const stored = localStorage.getItem('storage_folders');
      const folders = stored ? JSON.parse(stored) : [];
      folders.push(newFolder);
      localStorage.setItem('storage_folders', JSON.stringify(folders));
      return newFolder;
    }
    
    try {
      const result = await sql(
        'INSERT INTO folders (name, path) VALUES ($1, $2) RETURNING *',
        [folderData.name, folderData.path]
      );
      return {
        id: result[0].id,
        name: result[0].name,
        type: "folder" as const,
        modified: new Date(result[0].created_at).toLocaleDateString(),
        path: result[0].path
      };
    } catch (error) {
      console.error('Error creating folder in Neon:', error);
      throw error;
    }
  };

  const deleteNeonFile = async (id: number): Promise<boolean> => {
    if (!sql) {
      const stored = localStorage.getItem('storage_files');
      const files = stored ? JSON.parse(stored) : [];
      const filtered = files.filter((f: any) => f.id !== id);
      localStorage.setItem('storage_files', JSON.stringify(filtered));
      return true;
    }
    
    try {
      await sql('DELETE FROM files WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting file from Neon:', error);
      return false;
    }
  };

  const deleteNeonFolder = async (id: number): Promise<boolean> => {
    if (!sql) {
      const stored = localStorage.getItem('storage_folders');
      const folders = stored ? JSON.parse(stored) : [];
      const filtered = folders.filter((f: any) => f.id !== id);
      localStorage.setItem('storage_folders', JSON.stringify(filtered));
      return true;
    }
    
    try {
      await sql('DELETE FROM folders WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting folder from Neon:', error);
      return false;
    }
  };

  // Load files and folders using Neon functions
  useEffect(() => {
    const loadData = async () => {
      try {
        await initNeonDatabase();
        
        const [filesData, foldersData] = await Promise.all([
          getNeonFiles(),
          getNeonFolders()
        ]);

        const allItems: FileItem[] = [...foldersData, ...filesData];
        setFiles(allItems);
      } catch (error) {
        console.error('Error loading files and folders:', error);
      }
    };

    loadData();
    loadBackups();
  }, []);

  // Load available backups
  const loadBackups = async () => {
    try {
      const availableBackups = await getBackups();
      setBackups(availableBackups);
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "folder": return <Folder className="w-8 h-8 text-blue-400" />;
      case "pdf": return <FileText className="w-8 h-8 text-red-400" />;
      case "image": return <Image className="w-8 h-8 text-green-400" />;
      case "document": return <FileText className="w-8 h-8 text-blue-400" />;
      default: return <FileText className="w-8 h-8 text-gray-400" />;
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        const folderItem = await createNeonFolder({
          name: newFolderName,
          path: `${currentPath}${newFolderName.toLowerCase().replace(/\s+/g, '-')}`
        });

        setFiles(prev => [...prev, folderItem]);
        setNewFolderName("");
        setIsCreateFolderOpen(false);
      } catch (error) {
        console.error('Error creating folder:', error);
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const fileData = {
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type === 'application/pdf' ? 'pdf' : 'document',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          path: `${currentPath}${file.name}`
        };

        const fileItem = await createNeonFile(fileData);
        setFiles(prev => [...prev, fileItem]);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleDownload = (file: FileItem) => {
    // Create a download link for the file
    const link = document.createElement('a');
    link.href = file.path;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteClick = (item: FileItem) => {
    setDeleteConfirmation({
      isOpen: true,
      type: item.type === 'folder' ? 'folder' : 'file',
      item
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirmation.type === 'folder') {
        await deleteNeonFolder(deleteConfirmation.item.id);
      } else {
        await deleteNeonFile(deleteConfirmation.item.id);
      }

      setFiles(prev => prev.filter(f => f.id !== deleteConfirmation.item.id));
      setDeleteConfirmation({ isOpen: false, type: 'file', item: null });

    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleFolderOpen = (folder: FileItem) => {
    if (folder.type === 'folder') {
      setCurrentPath(folder.path + '/');
    }
  };

  const handleBackNavigation = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      pathParts.pop();
      setCurrentPath('/' + pathParts.join('/') + (pathParts.length > 0 ? '/' : ''));
    }
  };

  const filteredFiles = files.filter(file => 
    file.path.startsWith(currentPath) && 
    file.path.replace(currentPath, '').split('/').length === 1 &&
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pathBreadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <section className="mb-8 slide-up">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 gradient-text">File Storage</h2>
        <p className="text-gray-400 font-medium">Manage your study files and documents</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex space-x-3">
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button className="ios-button-secondary text-sm font-medium">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-0 max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-white text-lg font-semibold">Create New Folder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="glass-card-subtle border-0 text-white placeholder:text-gray-500"
                />
                <div className="flex space-x-3">
                  <Button onClick={handleCreateFolder} className="flex-1 ios-button-primary font-medium">
                    Create
                  </Button>
                  <Button 
                    onClick={() => setIsCreateFolderOpen(false)}
                    className="flex-1 ios-button-secondary font-medium"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button className="ios-button-secondary text-sm font-medium" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </label>
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center space-x-2 mb-4">
        {currentPath !== '/' && (
          <Button variant="ghost" size="sm" onClick={handleBackNavigation}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex items-center space-x-1 text-sm text-gray-400">
          <span>Home</span>
          {pathBreadcrumbs.map((part, index) => (
            <span key={index}>
              <span className="mx-1">/</span>
              <span>{part}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#27272a] border-gray-700"
        />
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <Card key={`${file.type}-${file.id}`} className="bg-[#27272a]/50 border-gray-800 hover:bg-[#27272a]/70 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div 
                  className="flex-1" 
                  onClick={() => file.type === 'folder' ? handleFolderOpen(file) : null}
                >
                  {getFileIcon(file.type)}
                  <h3 className="font-medium mt-2 mb-1 truncate">{file.name}</h3>
                  <div className="text-xs text-gray-400 space-y-1">
                    {file.size && <p>{file.size}</p>}
                    <p>Modified {file.modified}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {file.type !== 'folder' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(file)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">No files or folders found</div>
          {searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, type: 'file', item: null })}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirmation.type === 'file' ? 'File' : 'Folder'}`}
        description={`Are you sure you want to delete this ${deleteConfirmation.type}? This action cannot be undone.`}
        itemName={deleteConfirmation.item?.name}
      />
    </section>
  );
}