import os

def print_tree(startpath):
    exclude_dirs = {'.git', 'node_modules', '.next', '.turbo', 'dist', 'build', '.contentlayer', '.gradle', '.idea', '.vscode'}
    
    for root, dirs, files in os.walk(startpath):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        print('{}{}/'.format(indent, os.path.basename(root)))
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            print('{}{}'.format(subindent, f))

if __name__ == "__main__":
    print_tree('.')
