// MemberSelectModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Make sure Badge is imported correctly
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Phone,
  Mail,
  CreditCard,
  X,
  Check,
  AlertCircle
} from "lucide-react";

// If Badge is not available, you can create a simple fallback component
// const Badge = ({ children, variant, className }) => (
//   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
//     {children}
//   </span>
// );

export default function MemberSelectModal({ 
  open, 
  onClose, 
  members, 
  onSelect,
  selectedId,
  onSearch,
  searchTerm: externalSearchTerm,
  isSearching 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use external search if provided, otherwise use internal
  const effectiveSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : searchTerm;

  // Filter members based on search term
  useEffect(() => {
    if (!members || members.length === 0) {
      setFilteredMembers([]);
      return;
    }

    const search = effectiveSearchTerm.toLowerCase().trim();
    if (!search) {
      setFilteredMembers(members);
      return;
    }

    const filtered = members.filter(member => {
      // Try different field names from the new endpoint
      const firstName = (member.IndividualFirstName || member.firstName || '').toLowerCase();
      const lastName = (member.IndividualLastName || member.lastName || '').toLowerCase();
      const fullName = (member.FullName || member.fullName || `${firstName} ${lastName}`).toLowerCase();
      const memberNo = (member.Reference2 || member.MemberNumber || member.memberNumber || member.memberNo || '').toLowerCase();
      const idNumber = (member.IndividualIdentityCardNumber || member.idNumber || '').toLowerCase();
      const phone = (member.IndividualAddressMobileLine || member.IndividualAddressMobile || member.Phone || member.phone || '').toLowerCase();
      const payrollNumber = (member.PayrollNumber || member.payrollNumber || '').toLowerCase();
      
      return fullName.includes(search) ||
             memberNo.includes(search) ||
             idNumber.includes(search) ||
             phone.includes(search) ||
             payrollNumber.includes(search);
    });

    setFilteredMembers(filtered);
  }, [members, effectiveSearchTerm]);

  // Reset selected member when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMember(null);
      if (!externalSearchTerm) {
        setSearchTerm('');
      }
    } else if (selectedId) {
      const member = members.find(m => m.Id === selectedId);
      if (member) setSelectedMember(member);
    }
  }, [open, selectedId, members, externalSearchTerm]);

  const handleSelect = (member) => {
    setSelectedMember(member);
  };

  const handleConfirm = () => {
    if (selectedMember && onSelect) {
      onSelect(selectedMember.Id);
      onClose(false);
    }
  };

  const handleClose = () => {
    setSelectedMember(null);
    if (!externalSearchTerm) {
      setSearchTerm('');
    }
    onClose(false);
  };

  const handleSearchChange = (value) => {
    if (onSearch) {
      onSearch(value);
    } else {
      setSearchTerm(value);
    }
  };

  // Get member display name
  const getMemberName = (member) => {
    if (!member) return 'Unknown';
    const firstName = member.IndividualFirstName || member.firstName || '';
    const lastName = member.IndividualLastName || member.lastName || '';
    const fullName = member.FullName || member.fullName || `${firstName} ${lastName}`;
    return fullName.trim() || member.Reference2 || member.MemberNumber || member.memberNumber || 'Unknown';
  };

  // Get member number
  const getMemberNumber = (member) => {
    return member.MemberNumber || member.memberNumber || member.Reference2 || 'N/A';
  };

  // Get member status badge
  const getStatusBadge = (member) => {
    // Check if member has any active accounts or is active
    const isActive = member.IsActive !== false && member.recordStatus !== 0;
    const hasAccounts = member.accounts && member.accounts.length > 0;
    
    if (!hasAccounts) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          No Accounts
        </Badge>
      );
    }
    
    return isActive ? (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Active
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Inactive
      </Badge>
    );
  };

  // Get account badges
  const getAccountBadges = (member) => {
    if (!member.accounts || member.accounts.length === 0) {
      return null;
    }

    const accountTypes = member.accounts
      .slice(0, 3)
      .map(acc => acc.productDescription || acc.CustomerAccountTypeTargetProductDescription || 'Account')
      .filter(Boolean);

    return (
      <div className="mt-2 flex flex-wrap gap-1">
        {accountTypes.map((type, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs bg-gray-100">
            {type}
          </Badge>
        ))}
        {member.accounts.length > 3 && (
          <span className="text-xs text-gray-500 ml-1">
            +{member.accounts.length - 3} more
          </span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-indigo-600" />
            Select Member
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, member number, ID or phone..."
            value={effectiveSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            autoFocus
          />
          {effectiveSearchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Member Count */}
        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
          <span>
            {isSearching ? 'Searching...' : `${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''} found`}
          </span>
          {selectedMember && (
            <span className="text-indigo-600 font-medium flex items-center gap-1">
              <Check className="h-4 w-4" />
              Selected: {getMemberName(selectedMember)}
            </span>
          )}
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto mt-3 border rounded-lg">
          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
              <p>No members found</p>
              {effectiveSearchTerm && (
                <p className="text-sm">Try adjusting your search</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredMembers.map((member) => {
                const isSelected = selectedMember?.Id === member.Id;
                const name = getMemberName(member);
                const memberNo = getMemberNumber(member);
                const idNumber = member.IndividualIdentityCardNumber || member.idNumber || 'N/A';
                const phone = member.IndividualAddressMobileLine || member.IndividualAddressMobile || member.Phone || member.phone || 'N/A';
                const email = member.EmailAddress || member.IndividualEmailAddress || member.email || 'N/A';
                const accountCount = member.accounts?.length || 0;

                return (
                  <div
                    key={member.Id || member.id}
                    onClick={() => handleSelect(member)}
                    className={`p-4 cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {name}
                          </p>
                          {getStatusBadge(member)}
                          {accountCount > 0 && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              {accountCount} {accountCount === 1 ? 'Account' : 'Accounts'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Member: {memberNo}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span>ID: {idNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>Phone: {phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>Email: {email}</span>
                          </div>
                        </div>

                        {/* Account Badges */}
                        {getAccountBadges(member)}
                      </div>

                      {isSelected && (
                        <div className="ml-2 flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMember}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Select Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}