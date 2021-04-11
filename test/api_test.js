let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();

chai.use(chaiHttp);
let server = require('./../app');

describe('Cost Explorer', () => {
    describe('/GET Explorer', () => {
        it('it should GET all the cost explorer items', (done) => {
            chai.request(server)
                .get('/explorer')
                .end((err, res) => {
                    (res).should.have.status(200);
                    (res.body).should.be.a('object');
                    (res.body.data.length).should.be.greaterThan(0);
                    done();
                });
        });
    });
});
