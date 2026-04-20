import re

with open('frontend/src/pages/StudentCareerPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rename Component
content = content.replace('const ParentPortal: React.FC = () => {', 'import { useAuth } from \'../context/AuthContext\';\n\nconst StudentCareerPage: React.FC = () => {')
content = content.replace('export default ParentPortal;', 'export default StudentCareerPage;')

# 2. Fix Auth Hook
content = content.replace('const { id } = useParams<{ id: string }>();', 'const { id } = useParams<{ id: string }>();\n    const { token } = useAuth();')

# 3. Strip Pin Required block
content = re.sub(r'if \(isPinRequired && !data\) \{.*?(?=if \(error \|\| !data\))', '', content, flags=re.DOTALL)
content = content.replace('if (loading && !isPinRequired) {', 'if (loading) {')

# 4. Remove 'Parent Access (Read-only)' badge
content = re.sub(r'\{/\* Global Read-Only Label \*/\}.*?</header>', '</header>', content, flags=re.DOTALL)
content = content.replace('Student Strategy Review', 'Strategic Outlook')

with open('frontend/src/pages/StudentCareerPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fix Script Successful")
