class TrieNode {
  value : string;
  is_word : boolean;
  children : {[key:string] : TrieNode};
  count : number;
  constructor(count = 1, is_word = false){
    this.value = ""
    this.is_word = is_word;
    this.children = {};
    this.count = count;
  }
}

export class Trie {
  root : TrieNode;
  constructor(){this.root = new TrieNode()}

  insert(word: string){
    let node = this.root;
    for(let c of word){
      if(c in node.children){
        node = node.children[c];
        node.count += 1;
      }
      else{
        node.children[c] = new TrieNode();
        node = node.children[c]; 
      }
    }
    // node would be the last char in word;
    node.is_word = true;
    node.value = word;
  }

  findNode(prefix : string){
    let node = this.root;
    for(let c of prefix){
      if(c in node.children)
        node = node.children[c];
      else
        return null
    }
    return node;
  }

  findAllFromWord(word : string){
    let root = this.findNode(word);
    let result : string[] = [] 
    if(root === null)
      return result;
    this.dfs(root, result);
    return result;
  }
  
  dfs(root : TrieNode, arr: Array<string>){
    if(root.is_word)
      arr.push(root.value);
    for(let c in root.children)
      this.dfs(root.children[c], arr);
  }

  // the count of node must be 1
  retrieveCharactersFromNode(root : TrieNode){
    let arr : string[] = [];
    while(!root.is_word){
      // only one char in children
      for(let c in root.children)
        arr.push(c);
      root = root.children[arr[arr.length-1]];
    }

    return arr;
  }
}