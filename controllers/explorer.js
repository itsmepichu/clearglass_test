const db = require('../models');
const utils = require('../Utils');
const _ = require('lodash');

// ----------------------------------------------------------------------------

const getExplorerData = async (filters) => {

    let q_client_filter = ""
    let q_project_filter = ""
    let q_cost_type_filter = ""
    if(filters.client_id && filters.client_id.length > 0) {
        q_client_filter = " c.id in ("+filters.client_id.toString()+") ";
    }
    if(filters.project_id && filters.project_id.length > 0) {
        if(q_client_filter !== "") {
            q_project_filter += " and"
        }
        q_project_filter += " p.id in ("+filters.project_id.toString()+") ";
    }
    if(filters.cost_type_id && filters.cost_type_id.length > 0) {
        if(q_client_filter !== "" || q_project_filter !== "") {
            q_cost_type_filter += " and"
        }
        q_cost_type_filter += " ct.id in ("+filters.cost_type_id.toString()+") ";
    }


    let query = "select co.project_id, p.title as project_name, co.cost_type_id, ct.name as cost_type_name, p.client_id, c.name  as client_name, co.amount, ct.parent_id from costs co\n" +
        "inner join cost_types ct on ct.id = co.cost_type_id\n" +
        "inner join projects p on co.project_id = p.id\n" +
        "inner join clients c on c.id = p.client_id";

    if(q_client_filter !== "" || q_project_filter !== "" || q_cost_type_filter !== "") {
        query += " where";
        query += q_client_filter;
        query += q_project_filter;
        query += q_cost_type_filter;
    }

    return await db.sequelize.query(query)
}

const getCostTreeData = async ()=> {
    let query = "with recursive cost_type_tree as (\n" +
        "   select * from cost_types where parent_id is null\n" +
        "   union all\n" +
        "   select child.id, child.name, child.parent_id from cost_types as child\n" +
        "   join cost_type_tree as parent on parent.id = child.parent_id\n" +
        ") select *, false as is_visited from cost_type_tree;"
    return await db.sequelize.query(query)
}



const getData = async (req, res, next) => {

    try {
        let explorer_data = (await getExplorerData(req.query))[0]
        let cost_tree_data = (await getCostTreeData())[0]
        let result_data = []

        let client_grouped_data = _.groupBy(explorer_data, (x) => x.client_id)
        _.forEach(client_grouped_data, (client_data, client_id) => {
            let tmpClientObj = {
                id: client_id,
                name: client_data[0].client_name,
                type: 'client',
                amount: 0,
                children: []
            }
            let project_grouped_data = _.groupBy(client_data, (x)=> x.project_id);
            _.forEach(project_grouped_data, (project_data, project_id) => {
                let tmpProjectObj = {
                    id: project_id,
                    name: project_data[0].project_name,
                    type: 'project',
                    amount: 0,
                    children: []
                }
                tmpClientObj.children.push(tmpProjectObj)

                let cost_grouped_data = _.groupBy(project_data, (x)=> x.cost_type_id)
                _.forEach(cost_grouped_data, (cost_data, cost_type_id) => {
                    let tmpCostObj = {
                        id: cost_type_id,
                        name: cost_data[0].cost_type_name,
                        type: 'cost',
                        amount: parseFloat(cost_data[0].amount),
                        parent: cost_data[0].parent_id,
                        children: []
                    }
                    tmpProjectObj.children.push(tmpCostObj)
                    tmpProjectObj.amount += tmpCostObj.amount
                });
                buildCostTree(JSON.clone(cost_tree_data), tmpProjectObj)
                tmpClientObj.amount += tmpProjectObj.amount
            });
            result_data.push(tmpClientObj);
        });

        res.send(result_data)
    } catch (ex) {
        if(ex) {
            next(ex);
        }
    }

}

let buildCostTree = (tree_data, project_data) => {
    let extracted_tree_data = project_data.children;
    extracted_tree_data.forEach((obj) => {
        let tree_node = _.find(tree_data, {id: parseInt(obj.id)})
        if(tree_node) {
            tree_node.is_visited = true;
            tree_node.amount = obj.amount;
        }
    });

    let grouped_data = _.groupBy(tree_data, (node) => {
        return node.parent_id ? node.parent_id : 0
    });

    let parentObjArray = grouped_data[0];
    parentObjArray.forEach((parentObj) => {
        parentObj.children = []
        getChildren(parentObj, grouped_data);
    });
    project_data.children = parentObjArray
    treeCleanUp(project_data.children)
}

let getChildren = (obj, grouped_data) => {
    obj.children = grouped_data[obj.id];
    if(!obj.children || obj.children.length === 0) {
        obj.children = [];
        return obj;
    }
    obj.children.forEach((item) => {
        getChildren(item, grouped_data);
    });
}

let treeCleanUp = (treeArray) => {
    _.forEach(treeArray, (node, index) => {
        if(node) {
            if(node.children.length > 0) {
                treeCleanUp(node.children)
            }
            delete node.is_visited;
            delete node.parent_id;
            // let preserve_node = false;
            // _.forEach(node.children, (child_node) => {
            //     if(child_node.is_visited) {
            //         preserve_node = true;
            //     }
            // })
            // if(!node.is_visited && !preserve_node) {
            //     _.remove(treeArray, node)
            // }
        }
    });
}

module.exports = {
    getData
}
